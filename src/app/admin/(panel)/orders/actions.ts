"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import {
  addresses,
  customers,
  orderItems,
  orders,
  payments,
  products,
  variants,
} from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"
import { resolveShippingCost } from "@/lib/checkout/shipping"
import { getSettingValues } from "@/lib/queries/settings"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function setOrderStatus(
  id: string,
  patch: Partial<{
    status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded"
    paymentStatus: "unpaid" | "proof_uploaded" | "verified" | "failed" | "refunded"
    fulfillmentStatus: "unfulfilled" | "preparing" | "shipped" | "delivered" | "returned"
    paidAt: Date | null
    shippedAt: Date | null
    deliveredAt: Date | null
    cancelledAt: Date | null
    cancelledReason: string | null
  }>
): Promise<ActionResult> {
  await requireAdminRole("staff")
  try {
    await db
      .update(orders)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false,
      error: "No se pudo actualizar: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath("/admin")
  return { ok: true }
}

export async function confirmOrder(id: string) {
  return setOrderStatus(id, { status: "confirmed" })
}

export async function approvePayment(id: string) {
  await requireAdminRole("staff")
  try {
    // Mark all payments of this order as verified
    await db
      .update(payments)
      .set({ status: "verified", verifiedAt: new Date() })
      .where(eq(payments.orderId, id))
    await db
      .update(orders)
      .set({
        paymentStatus: "verified",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false as const,
      error: "No se pudo aprobar el pago: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  return { ok: true as const }
}

export async function rejectPayment(id: string, reason?: string) {
  await requireAdminRole("staff")
  try {
    await db
      .update(payments)
      .set({
        status: "failed",
        rejectionReason: reason ?? "Comprobante no válido",
      })
      .where(eq(payments.orderId, id))
    await db
      .update(orders)
      .set({ paymentStatus: "unpaid", updatedAt: new Date() })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false as const,
      error: "No se pudo rechazar el pago: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  return { ok: true as const }
}

export async function markPaidCoD(id: string) {
  return setOrderStatus(id, {
    paymentStatus: "verified",
    paidAt: new Date(),
  })
}

export async function markPreparing(id: string) {
  return setOrderStatus(id, { fulfillmentStatus: "preparing" })
}

export async function markShipped(id: string) {
  return setOrderStatus(id, {
    status: "shipped",
    fulfillmentStatus: "shipped",
    shippedAt: new Date(),
  })
}

export async function markDelivered(id: string) {
  return setOrderStatus(id, {
    status: "delivered",
    fulfillmentStatus: "delivered",
    deliveredAt: new Date(),
  })
}

export async function cancelOrder(id: string, reason?: string) {
  return setOrderStatus(id, {
    status: "cancelled",
    cancelledAt: new Date(),
    cancelledReason: reason ?? null,
  })
}

// ---------------------------------------------------------------------------
// Preorder-specific actions. These are no-ops for orders without
// depositAmount set (i.e. plain in-stock orders go through the regular flow).
// ---------------------------------------------------------------------------

/** Mark the deposit as received (after Ever verifies the comprobante). */
export async function approveDeposit(id: string) {
  await requireAdminRole("staff")
  try {
    await db
      .update(orders)
      .set({
        depositPaidAt: new Date(),
        sourcingStatus: "sourcing",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false as const,
      error: "No se pudo aprobar el depósito: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  return { ok: true as const }
}

/** Move the sourcing status forward. Allowed values: sourcing | in_transit | arrived. */
export async function setSourcingStatus(
  id: string,
  status: "sourcing" | "in_transit" | "arrived",
) {
  await requireAdminRole("staff")
  try {
    await db
      .update(orders)
      .set({
        sourcingStatus: status,
        arrivedAtStockAt: status === "arrived" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false as const,
      error: "No se pudo actualizar: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  return { ok: true as const }
}

/** Mark the balance as received. Pedido pasa a paymentStatus=verified + paidAt. */
export async function approveBalance(id: string) {
  await requireAdminRole("staff")
  try {
    await db
      .update(orders)
      .set({
        balancePaidAt: new Date(),
        paymentStatus: "verified",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
  } catch (err) {
    return {
      ok: false as const,
      error: "No se pudo aprobar el saldo: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${id}`)
  return { ok: true as const }
}

// Helper for deriving order_number atomically (server-side only)
export async function nextOrderNumber(): Promise<string> {
  const result = await db.execute(
    sql`SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1 AS next FROM orders`
  )
  const row = result[0] as { next?: number } | undefined
  const n = row?.next ?? 1
  return `M90-${String(n).padStart(6, "0")}`
}

// ---------------------------------------------------------------------------
// Manual order creation — admin metió un pedido por WhatsApp y lo registra.
// ---------------------------------------------------------------------------

export interface CustomerSuggestion {
  id: string
  name: string
  phone: string | null
  email: string | null
  totalOrders: number
  totalSpent: number
}

/**
 * Type-ahead search for the customer picker on /admin/orders/new.
 * Matches against name + phone + email. Capped at 10 to keep the
 * dropdown short.
 */
export async function searchCustomersAction(
  query: string,
): Promise<CustomerSuggestion[]> {
  try {
    await requireAdminRole("staff")
  } catch {
    return []
  }
  const trimmed = query.trim()
  if (trimmed.length === 0) return []
  const q = `%${trimmed}%`
  try {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
      })
      .from(customers)
      .where(
        and(
          isNull(customers.deletedAt),
          or(
            ilike(customers.name, q),
            ilike(customers.phone, q),
            ilike(customers.email, q),
          )!,
        ),
      )
      .orderBy(desc(customers.totalSpent), desc(customers.createdAt))
      .limit(10)
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      totalOrders: r.totalOrders,
      totalSpent: Number(r.totalSpent),
    }))
  } catch {
    return []
  }
}

/**
 * Lightweight product picker for the manual order form. Reuses the
 * server-side search pattern from products/actions.ts but exposes
 * variants too so the admin can pick a size + see live stock.
 */
export interface ManualOrderProductHit {
  id: string
  slug: string
  name: string
  team: string | null
  primaryImageUrl: string | null
  basePrice: number
  isPreorder: boolean
  variants: Array<{
    id: string
    size: string
    stock: number
    price: number
  }>
}

export async function searchProductsForManualOrderAction(
  query: string,
  kind: "preorder" | "in_stock" | "both" = "both",
): Promise<ManualOrderProductHit[]> {
  try {
    await requireAdminRole("staff")
  } catch {
    return []
  }
  const trimmed = query.trim()
  if (trimmed.length === 0) return []
  const q = `%${trimmed}%`

  const conditions = [isNull(products.deletedAt)]
  if (kind === "preorder") conditions.push(eq(products.isPreorder, true))
  else if (kind === "in_stock") conditions.push(eq(products.isPreorder, false))
  conditions.push(
    or(
      ilike(products.name, q),
      ilike(products.team, q),
      ilike(products.playerName, q),
      ilike(products.slug, q),
    )!,
  )

  try {
    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        team: products.team,
        basePrice: products.basePrice,
        isPreorder: products.isPreorder,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.featured))
      .limit(20)

    if (rows.length === 0) return []

    const ids = rows.map((r) => r.id)
    const [imgs, vs] = await Promise.all([
      db
        .select({
          productId: products.id,
          url: sql<string>`(
            SELECT url FROM product_images
            WHERE product_id = ${products.id}
              AND is_primary = true
            LIMIT 1
          )`,
        })
        .from(products)
        .where(inArray(products.id, ids)),
      db
        .select({
          id: variants.id,
          productId: variants.productId,
          size: variants.size,
          stock: variants.stock,
          price: variants.price,
        })
        .from(variants)
        .where(inArray(variants.productId, ids)),
    ])
    const imgMap = new Map<string, string | null>()
    for (const r of imgs) imgMap.set(r.productId, r.url ?? null)
    const variantMap = new Map<string, ManualOrderProductHit["variants"]>()
    for (const v of vs) {
      const list = variantMap.get(v.productId) ?? []
      list.push({
        id: v.id,
        size: v.size,
        stock: v.stock,
        price: Number(v.price ?? 0),
      })
      variantMap.set(v.productId, list)
    }

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      team: r.team,
      primaryImageUrl: imgMap.get(r.id) ?? null,
      basePrice: Number(r.basePrice),
      isPreorder: r.isPreorder,
      variants: (variantMap.get(r.id) ?? []).map((v) => ({
        ...v,
        // Fall back to base price when the variant doesn't override it.
        price: v.price > 0 ? v.price : Number(r.basePrice),
      })),
    }))
  } catch {
    return []
  }
}

const PROVINCES = [
  "PINAR_DEL_RIO",
  "ARTEMISA",
  "LA_HABANA",
  "MAYABEQUE",
  "MATANZAS",
] as const

const manualItemSchema = z
  .object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    addOns: z
      .object({
        longSleeves: z.boolean().optional(),
        patches: z.boolean().optional(),
        playerName: z.string().trim().max(20).optional(),
        playerNumber: z.string().trim().regex(/^\d{1,3}$/).optional(),
      })
      .optional(),
  })
  .strict()

const manualOrderSchema = z
  .object({
    customer: z
      .object({
        existingId: z.string().optional(),
        name: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(6).max(20),
        email: z.string().trim().email().max(120).optional().or(z.literal("")),
        country: z.string().trim().max(40).optional(),
      })
      .strict(),
    shipping: z
      .object({
        recipientName: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(6).max(20),
        street: z.string().trim().min(1).max(160),
        number: z.string().trim().max(20).optional().or(z.literal("")),
        municipality: z.string().trim().min(1).max(80),
        province: z.enum(PROVINCES),
        reference: z.string().trim().max(240).optional().or(z.literal("")),
      })
      .strict(),
    items: z.array(manualItemSchema).min(1).max(20),
    paymentMethod: z.enum([
      "transfermovil",
      "cash_on_delivery",
      "zelle",
      "paypal",
    ]),
    markAsPaid: z.boolean().default(false),
    notesCustomer: z.string().trim().max(500).optional().or(z.literal("")),
    notesInternal: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .strict()

export type ManualOrderInput = z.infer<typeof manualOrderSchema>

export type ManualOrderResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: string }

/**
 * Create an order on behalf of a customer the admin already talked to
 * via WhatsApp/in person. Differs from the public /api/orders flow:
 *   - Skips the rate-limit + bot-check gauntlet (admin is trusted).
 *   - Lands as `confirmed` (not `pending`) since Ever already vetted it.
 *   - Optional `markAsPaid` flag pre-stamps paymentStatus=verified.
 *   - Server still re-prices add-ons from settings (never from client).
 */
export async function createManualOrderAction(
  input: ManualOrderInput,
): Promise<ManualOrderResult> {
  let admin
  try {
    admin = await requireAdminRole("staff")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Sin permisos."
          : "No autenticado.",
    }
  }

  const parsed = manualOrderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }
  const data = parsed.data

  // Pull variants + product info for the items.
  const variantIds = data.items.map((i) => i.variantId)
  const variantRows = await db
    .select({
      id: variants.id,
      productId: variants.productId,
      size: variants.size,
      sku: variants.sku,
      stock: variants.stock,
      price: variants.price,
      productName: products.name,
      basePrice: products.basePrice,
      isPreorder: products.isPreorder,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, variantIds))
  if (variantRows.length !== variantIds.length) {
    return { ok: false, error: "Uno o más productos no están disponibles." }
  }

  // Pull add-on prices from settings.
  const addonSettings = await getSettingValues([
    "addon.longSleevesPrice",
    "addon.patchesPrice",
    "addon.personalizationPrice",
  ])
  const addonPrices = {
    longSleeves: Number(addonSettings["addon.longSleevesPrice"] ?? 1),
    patches: Number(addonSettings["addon.patchesPrice"] ?? 3),
    personalization: Number(addonSettings["addon.personalizationPrice"] ?? 5),
  }

  // Snapshot items with server-priced add-ons.
  const snapshots = data.items.map((it) => {
    const v = variantRows.find((x) => x.id === it.variantId)!
    const unitPrice = Number(v.price ?? v.basePrice)

    let addOns: { longSleeves: boolean; patches: boolean; playerName?: string; playerNumber?: string; total: number } | undefined
    let addOnTotal = 0
    if (it.addOns) {
      const longSleeves = !!it.addOns.longSleeves
      const patches = !!it.addOns.patches
      const hasName = !!it.addOns.playerName
      const hasNumber = !!it.addOns.playerNumber
      const personalization = hasName || hasNumber
      addOnTotal =
        (longSleeves ? addonPrices.longSleeves : 0) +
        (patches ? addonPrices.patches : 0) +
        (personalization ? addonPrices.personalization : 0)
      if (longSleeves || patches || personalization) {
        addOns = {
          longSleeves,
          patches,
          playerName: it.addOns.playerName,
          playerNumber: it.addOns.playerNumber,
          total: addOnTotal,
        }
      }
    }

    return {
      variantId: v.id,
      productId: v.productId,
      productName: v.productName,
      size: v.size,
      sku: v.sku,
      quantity: it.quantity,
      unitPrice,
      addOnTotal,
      lineUnit: unitPrice + addOnTotal,
      addOns,
      isPreorder: v.isPreorder,
    }
  })

  const subtotal = snapshots.reduce(
    (s, it) => s + it.lineUnit * it.quantity,
    0,
  )

  const country = data.customer.country?.trim() || "CU"
  const isDiaspora = country !== "CU"
  const shipping = await resolveShippingCost({
    provinceEnumValue: data.shipping.province,
    subtotal,
    isDiaspora,
  })
  const shippingCost = shipping.cost

  // Preorder split: if any item is preorder, calculate deposit/balance.
  const stockSubtotal = snapshots
    .filter((s) => !s.isPreorder)
    .reduce((s, it) => s + it.lineUnit * it.quantity, 0)
  const preorderSubtotal = snapshots
    .filter((s) => s.isPreorder)
    .reduce((s, it) => s + it.lineUnit * it.quantity, 0)
  const hasPreorder = preorderSubtotal > 0

  let depositAmount: number | null = null
  let balanceAmount: number | null = null
  if (hasPreorder) {
    const settingsRows = await getSettingValues(["preorder.depositPercentage"])
    const depositPctRaw = Number(
      settingsRows["preorder.depositPercentage"] ?? 30,
    )
    const depositPct = Math.max(0, Math.min(100, depositPctRaw))
    depositAmount =
      stockSubtotal + (preorderSubtotal * depositPct) / 100 + shippingCost
    balanceAmount = preorderSubtotal - (preorderSubtotal * depositPct) / 100
  }

  const total = subtotal + shippingCost

  // 1. Find or create customer.
  let customerId: string
  if (data.customer.existingId) {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, data.customer.existingId))
      .limit(1)
    if (existing.length === 0) {
      return { ok: false, error: "Cliente no encontrado." }
    }
    customerId = existing[0]!.id
    // Optionally update phone/email if changed — left for future iteration.
  } else {
    // Try matching by phone first to avoid dupes.
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, data.customer.phone))
      .limit(1)
    if (existing.length > 0) {
      customerId = existing[0]!.id
    } else {
      customerId = `cus_${createId()}`
      await db.insert(customers).values({
        id: customerId,
        phone: data.customer.phone,
        email: data.customer.email || null,
        name: data.customer.name,
        country,
        isDiaspora,
        hasAccount: false,
      })
    }
  }

  // 2. Create address.
  const addressId = `adr_${createId()}`
  await db.insert(addresses).values({
    id: addressId,
    customerId,
    recipientName: data.shipping.recipientName,
    phone: data.shipping.phone,
    street: data.shipping.street,
    number: data.shipping.number || null,
    municipality: data.shipping.municipality,
    province: data.shipping.province,
    reference: data.shipping.reference || null,
    isDefault: false,
  })

  // 3. Create order + items in a transaction.
  const orderId = `ord_${createId()}`
  const orderNumber = await nextOrderNumber()
  const now = new Date()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        customerId,
        // Manual orders are pre-vetted by Ever, so they skip the
        // "pending" review step and land confirmed.
        status: "confirmed",
        paymentStatus: data.markAsPaid ? "verified" : "unpaid",
        fulfillmentStatus: "unfulfilled",
        subtotal: String(subtotal),
        shippingCost: String(shippingCost),
        discountTotal: "0",
        total: String(total),
        currency: "USD",
        shippingAddressId: addressId,
        shippingMethod: shipping.zoneName ?? "Mensajería propia",
        paymentMethod: data.paymentMethod,
        notesCustomer: data.notesCustomer || null,
        notesInternal: data.notesInternal || null,
        depositAmount: depositAmount !== null ? String(depositAmount) : null,
        balanceAmount: balanceAmount !== null ? String(balanceAmount) : null,
        depositPaidAt: data.markAsPaid && hasPreorder ? now : null,
        sourcingStatus: hasPreorder ? "not_started" : null,
        paidAt: data.markAsPaid && !hasPreorder ? now : null,
      })

      await tx.insert(orderItems).values(
        snapshots.map((s) => ({
          id: `oitm_${createId()}`,
          orderId,
          variantId: s.variantId,
          productName: s.productName,
          variantSize: s.size,
          sku: s.sku,
          quantity: s.quantity,
          unitPrice: String(s.unitPrice),
          subtotal: String(s.lineUnit * s.quantity),
          addOns: s.addOns ?? null,
        })),
      )

      // If admin marked as paid, leave a payment row for traceability.
      if (data.markAsPaid) {
        await tx.insert(payments).values({
          id: `pay_${createId()}`,
          orderId,
          method: data.paymentMethod,
          amount: String(depositAmount ?? total),
          currency: "USD",
          proofUrl: null,
          transactionRef: "manual",
          status: "verified",
          verifiedBy: admin.admin.id,
          verifiedAt: now,
        })
      }
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[orders] manual create failed:", msg)
    return { ok: false, error: "No se pudo crear el pedido." }
  }

  revalidatePath("/admin/orders")
  revalidatePath("/admin")
  return { ok: true, orderId, orderNumber }
}
