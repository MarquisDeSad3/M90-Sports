import { NextResponse } from "next/server"
import { eq, inArray, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import {
  addresses,
  coupons,
  customers,
  orderItems,
  orders,
  variants,
  products,
} from "@/lib/db/schema"
import { orderInputSchema, type OrderInput } from "@/lib/validation/order"
import { resolveShippingCost } from "@/lib/checkout/shipping"
import { applyCoupon } from "@/lib/checkout/coupon"
import {
  banIp,
  checkAntiBot,
  checkOrderLimits,
  pruneRateLimits,
} from "@/lib/security/rate-limit"
import { getClientIp, looksLikeBrowser } from "@/lib/security/get-ip"
import { getSettingValues } from "@/lib/queries/settings"

/** Clamp a percentage value into 0..100 — defensive against bad config. */
function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 30
  return Math.max(0, Math.min(100, n))
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_BODY_BYTES = 16 * 1024 // 16KB — order payloads are tiny

/** Generic error response. We never leak internals to the client. */
function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code }, { status })
}

/** Structured server-side log for auditability (no PII beyond IP). */
function logSecurityEvent(event: {
  ip: string
  reason: string
  status: number
  ua: string | null
}) {
  console.warn("[orders][security]", JSON.stringify(event))
}

// Shipping is now resolved by lib/checkout/shipping.ts — it queries
// shipping_zones first and falls back to the legacy hardcoded numbers
// if no zone matches.

async function nextOrderNumber(): Promise<string> {
  const result = await db.execute(
    sql`SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1 AS next FROM orders`,
  )
  const row = result[0] as { next?: number } | undefined
  const n = row?.next ?? 1
  return `M90-${String(n).padStart(6, "0")}`
}

function buildWhatsAppMessage(opts: {
  orderNumber: string
  items: { name: string; size: string; quantity: number; subtotal: number }[]
  total: number
  depositAmount: number | null
  balanceAmount: number | null
  customerName: string
  shippingSummary: string
  paymentMethod: string
  trackingUrl: string
  payUrl: string | null
}) {
  const itemsLines = opts.items
    .map(
      (it) =>
        `• ${it.quantity}× ${it.name} (talla ${it.size.replace("KIDS_", "Niño ")}) — $${it.subtotal.toFixed(0)}`,
    )
    .join("\n")
  const paymentLabel: Record<string, string> = {
    transfermovil: "Transfermóvil",
    cash_on_delivery: "Efectivo a la entrega",
    zelle: "Zelle",
    paypal: "PayPal",
  }
  const lines = [
    `Hola M90, soy ${opts.customerName}.`,
    `Pedido ${opts.orderNumber}:`,
    "",
    itemsLines,
    "",
  ]
  if (opts.depositAmount !== null && opts.balanceAmount !== null) {
    lines.push(
      `Total: $${opts.total.toFixed(0)}`,
      `→ A pagar ahora: $${opts.depositAmount.toFixed(0)}`,
      `→ A pagar al recibir: $${opts.balanceAmount.toFixed(0)}`,
      "(pedido por encargo — entre 15 y 25 días)",
    )
  } else {
    lines.push(`Total: $${opts.total.toFixed(0)}`)
  }
  lines.push(
    `Pago: ${paymentLabel[opts.paymentMethod] ?? opts.paymentMethod}`,
    `Dirección: ${opts.shippingSummary}`,
    "",
    `Estado del pedido: ${opts.trackingUrl}`,
  )
  if (opts.payUrl) {
    lines.push(`Subir comprobante: ${opts.payUrl}`)
  }
  return lines.join("\n")
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ua = request.headers.get("user-agent")

  // 1. Cheap client-shape check — refuses obvious non-browser tooling.
  // We reply with the same generic 400 we use for every other anti-bot
  // signal so an attacker can't distinguish "blocked because of UA" vs
  // "blocked because of honeypot" from the response alone.
  if (!looksLikeBrowser(request)) {
    logSecurityEvent({ ip, reason: "non-browser-ua", status: 400, ua })
    return fail(400, "No pudimos validar tu solicitud.")
  }

  // 2. Body-size cap. Reject before parsing if Content-Length is suspicious.
  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    logSecurityEvent({ ip, reason: "body-too-large", status: 413, ua })
    return fail(413, "Pedido demasiado grande.")
  }

  // 3. Multi-tier rate limit + ban check. We DO surface the 429 with a
  // Retry-After header here because that's a legitimate signal a real
  // client (a frantic customer) needs in order to back off — there's
  // no information advantage for an attacker, just a "wait" hint.
  const limit = await checkOrderLimits(ip)
  if (!limit.ok) {
    logSecurityEvent({ ip, reason: `rl:${limit.reason}`, status: 429, ua })
    const retry = limit.retryAfterSeconds
    const res = fail(
      limit.reason === "banned" ? 403 : 429,
      limit.reason === "banned"
        ? "Tu acceso fue suspendido por actividad sospechosa."
        : "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
    )
    if (retry) res.headers.set("Retry-After", String(retry))
    return res
  }

  // 4. Parse body. We already capped Content-Length; this is the safety net.
  // From here on, every reject path returns the SAME generic message so
  // the response can't be used to fingerprint which check tripped.
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) {
    logSecurityEvent({ ip, reason: "body-too-large-actual", status: 413, ua })
    return fail(413, "Pedido demasiado grande.")
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    logSecurityEvent({ ip, reason: "bad-json", status: 400, ua })
    return fail(400, "No pudimos validar tu solicitud.")
  }

  // 5. Schema validation — strict mode rejects unknown fields.
  const parsed = orderInputSchema.safeParse(raw)
  if (!parsed.success) {
    // Log which field tripped so we can debug rejected legitimate orders
    // without having to reproduce the exact payload. The client still
    // gets a generic 400 — the breakdown stays in the server logs.
    const issues = parsed.error.issues.slice(0, 3).map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.code}`,
    )
    logSecurityEvent({
      ip,
      reason: `schema:${issues.join("|")}`,
      status: 400,
      ua,
    })
    return fail(400, "No pudimos validar tu solicitud.")
  }
  const body: OrderInput = parsed.data

  // 6. Anti-bot signals (honeypot + dwell time). Honeypot trips trigger
  // an immediate ban — we still log internally with the specific reason
  // for forensics, but the client always sees the same generic 400.
  const antibot = checkAntiBot({
    honeypot: body._hp,
    formStartedAt: body._t,
  })
  if (!antibot.ok) {
    if (antibot.reason === "honeypot") {
      await banIp(ip, "honeypot", 7 * 24 * 60 * 60)
    }
    logSecurityEvent({ ip, reason: `bot:${antibot.reason}`, status: 400, ua })
    return fail(400, "No pudimos validar tu solicitud.")
  }

  // 7. Look up variants + their products.
  const variantIds = body.items.map((i) => i.variantId)
  const variantRows = await db
    .select({
      id: variants.id,
      productId: variants.productId,
      size: variants.size,
      sku: variants.sku,
      stock: variants.stock,
      price: variants.price,
      productName: products.name,
      productTeam: products.team,
      basePrice: products.basePrice,
      productStatus: products.status,
      productIsPreorder: products.isPreorder,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, variantIds))

  if (variantRows.length !== variantIds.length) {
    return fail(400, "Uno o más productos del carrito no están disponibles.")
  }
  const unpublished = variantRows.find((v) => v.productStatus !== "published")
  if (unpublished) {
    return fail(400, "Uno o más productos no están publicados.")
  }

  // 8. Build snapshot items + totals.
  const snapshots = body.items.map((it) => {
    const v = variantRows.find((x) => x.id === it.variantId)!
    const unitPrice = Number(v.price ?? v.basePrice)
    return {
      variantId: v.id,
      productId: v.productId,
      productName: v.productName,
      size: v.size,
      sku: v.sku,
      quantity: Math.max(1, Math.min(20, Math.floor(it.quantity || 1))),
      unitPrice,
      isPreorder: v.productIsPreorder,
    }
  })
  const subtotal = snapshots.reduce(
    (s, it) => s + it.unitPrice * it.quantity,
    0,
  )

  const country = body.customer.country ?? "CU"
  const isDiaspora = country !== "CU"
  const shipping = await resolveShippingCost({
    provinceEnumValue: body.shippingAddress.province,
    subtotal,
    isDiaspora,
  })
  const shippingCost = shipping.cost

  // Coupon — validate before we create anything in DB so a bad code
  // is a clean 400, not a half-created order.
  let couponDiscount = 0
  let couponShippingDiscount = 0
  let appliedCouponId: string | null = null
  let appliedCouponCode: string | null = null
  if (body.couponCode) {
    const result = await applyCoupon({
      rawCode: body.couponCode,
      subtotal,
      shippingCost,
    })
    if (!result.ok) {
      return fail(400, result.error)
    }
    couponDiscount = result.discount
    couponShippingDiscount = result.shippingDiscount
    appliedCouponId = result.couponId
    appliedCouponCode = result.code
  }

  const discountTotal = couponDiscount + couponShippingDiscount
  const total = Math.max(
    0,
    subtotal + shippingCost - couponDiscount - couponShippingDiscount,
  )

  // Preorder split: if any item is isPreorder, the customer pays a
  // configurable deposit upfront (in-stock items + shipping in full,
  // preorder items at depositPct%) and the remaining preorder balance
  // when the goods land in Cuba. Pure in-stock orders leave both null
  // and the existing flow runs unchanged.
  const stockSubtotal = snapshots
    .filter((s) => !s.isPreorder)
    .reduce((s, it) => s + it.unitPrice * it.quantity, 0)
  const preorderSubtotal = snapshots
    .filter((s) => s.isPreorder)
    .reduce((s, it) => s + it.unitPrice * it.quantity, 0)
  const hasPreorder = preorderSubtotal > 0

  let depositAmount: number | null = null
  let balanceAmount: number | null = null
  if (hasPreorder) {
    const settingsRows = await getSettingValues(["preorder.depositPercentage"])
    const depositPct = clampPct(
      Number(settingsRows["preorder.depositPercentage"] ?? 30),
    )
    // Discounts come off the deposit first (they apply to what the
    // customer pays now, not to the balance owed on arrival).
    const shippingPaidNow = Math.max(0, shippingCost - couponShippingDiscount)
    depositAmount = Math.max(
      0,
      stockSubtotal +
        (preorderSubtotal * depositPct) / 100 +
        shippingPaidNow -
        couponDiscount,
    )
    balanceAmount = preorderSubtotal - (preorderSubtotal * depositPct) / 100
  }

  // 9. Find or create customer (by phone).
  let customerId: string
  try {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, body.customer.phone))
      .limit(1)
    if (existing.length > 0) {
      customerId = existing[0]!.id
    } else {
      customerId = `cus_${createId()}`
      await db.insert(customers).values({
        id: customerId,
        phone: body.customer.phone,
        email: body.customer.email ?? null,
        name: body.customer.name,
        country,
        isDiaspora,
        hasAccount: false,
      })
    }

    // 10. Create address.
    const addressId = `adr_${createId()}`
    await db.insert(addresses).values({
      id: addressId,
      customerId,
      recipientName: body.shippingAddress.recipientName,
      phone: body.shippingAddress.phone,
      street: body.shippingAddress.street,
      number: body.shippingAddress.number ?? null,
      betweenStreets: body.shippingAddress.betweenStreets ?? null,
      neighborhood: body.shippingAddress.neighborhood ?? null,
      municipality: body.shippingAddress.municipality,
      province: body.shippingAddress.province,
      reference: body.shippingAddress.reference ?? null,
      isDefault: false,
    })

    // 11. Order + items in a transaction.
    const orderId = `ord_${createId()}`
    const orderNumber = await nextOrderNumber()

    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        customerId,
        status: "pending",
        paymentStatus: "unpaid",
        fulfillmentStatus: "unfulfilled",
        subtotal: String(subtotal),
        shippingCost: String(shippingCost),
        discountTotal: String(discountTotal),
        total: String(total),
        currency: "USD",
        shippingAddressId: addressId,
        shippingMethod: shipping.zoneName ?? "Mensajería propia",
        paymentMethod: body.paymentMethod,
        notesCustomer: body.notesCustomer ?? null,
        couponCode: appliedCouponCode,
        depositAmount: depositAmount !== null ? String(depositAmount) : null,
        balanceAmount: balanceAmount !== null ? String(balanceAmount) : null,
        sourcingStatus: hasPreorder ? "not_started" : null,
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
          subtotal: String(s.unitPrice * s.quantity),
        })),
      )

      // Bump the coupon's used_count atomically — same transaction as
      // the order so an order rollback can't leave it artificially
      // counted.
      if (appliedCouponId) {
        await tx
          .update(coupons)
          .set({
            usedCount: sql`${coupons.usedCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(coupons.id, appliedCouponId))
      }
    })

    // 12. WhatsApp link.
    const a = body.shippingAddress
    const shippingSummary = [
      a.street,
      a.number,
      a.betweenStreets ? `(${a.betweenStreets})` : "",
      a.neighborhood,
      a.municipality,
      a.province.replace(/_/g, " "),
    ]
      .filter(Boolean)
      .join(", ")

    // Public links the customer can revisit later. Cash-on-delivery
    // doesn't need an upload page (no proof to send), so we omit it.
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://m90-sports.com"
    const trackingUrl = `${siteUrl}/pedido/${orderNumber}`
    const payUrl =
      body.paymentMethod === "cash_on_delivery"
        ? null
        : `${siteUrl}/pedido/${orderNumber}/pagar`

    const message = buildWhatsAppMessage({
      orderNumber,
      items: snapshots.map((s) => ({
        name: s.productName,
        size: s.size,
        quantity: s.quantity,
        subtotal: s.unitPrice * s.quantity,
      })),
      total,
      depositAmount,
      balanceAmount,
      customerName: body.customer.name,
      shippingSummary,
      paymentMethod: body.paymentMethod,
      trackingUrl,
      payUrl,
    })

    const whatsappNumber =
      process.env.M90_WHATSAPP_NUMBER?.replace(/[^\d]/g, "") ?? "5351191461"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message,
    )}`

    // Opportunistic prune — cheap and keeps the table small.
    if (Math.random() < 0.05) {
      pruneRateLimits().catch(() => {
        /* best-effort */
      })
    }

    return NextResponse.json({
      id: orderId,
      orderNumber,
      total,
      subtotal,
      shippingCost,
      depositAmount,
      balanceAmount,
      whatsappUrl,
    })
  } catch (err) {
    // Only log the message, never the full error object — Postgres
    // exceptions sometimes carry the failed row, which would leak PII
    // (phone, name, address) into the container's stdout.
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[orders] failed to create order:", msg)
    return fail(500, "No pudimos crear el pedido. Intenta de nuevo.")
  }
}
