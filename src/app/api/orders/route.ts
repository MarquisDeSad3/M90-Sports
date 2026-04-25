import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import {
  addresses,
  customers,
  orderItems,
  orders,
  variants,
  products,
} from "@/lib/db/schema"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface OrderItemBody {
  variantId: string
  quantity: number
}

interface OrderRequestBody {
  items: OrderItemBody[]
  customer: {
    name: string
    phone: string
    email?: string
    country?: string
  }
  shippingAddress: {
    recipientName: string
    phone: string
    street: string
    number?: string
    betweenStreets?: string
    neighborhood?: string
    municipality: string
    province:
      | "PINAR_DEL_RIO"
      | "ARTEMISA"
      | "LA_HABANA"
      | "MAYABEQUE"
      | "MATANZAS"
    reference?: string
  }
  paymentMethod: "transfermovil" | "cash_on_delivery" | "zelle" | "paypal"
  notesCustomer?: string
}

function shippingCostForProvince(province: string, isDiaspora: boolean): number {
  // Diaspora pays a flat international handling on top of local
  const base = (() => {
    switch (province) {
      case "LA_HABANA":
      case "MAYABEQUE":
        return 5
      case "ARTEMISA":
      case "MATANZAS":
        return 8
      case "PINAR_DEL_RIO":
        return 10
      default:
        return 12
    }
  })()
  return isDiaspora ? base + 3 : base
}

async function nextOrderNumber(): Promise<string> {
  const result = await db.execute(
    sql`SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1 AS next FROM orders`
  )
  const row = result[0] as { next?: number } | undefined
  const n = row?.next ?? 1
  return `M90-${String(n).padStart(6, "0")}`
}

function buildWhatsAppMessage(opts: {
  orderNumber: string
  items: { name: string; size: string; quantity: number; subtotal: number }[]
  total: number
  customerName: string
  shippingSummary: string
  paymentMethod: string
}) {
  const itemsLines = opts.items
    .map(
      (it) =>
        `• ${it.quantity}× ${it.name} (talla ${it.size.replace("KIDS_", "Niño ")}) — $${it.subtotal.toFixed(0)}`
    )
    .join("\n")
  const paymentLabel: Record<string, string> = {
    transfermovil: "Transfermóvil",
    cash_on_delivery: "Efectivo a la entrega",
    zelle: "Zelle",
    paypal: "PayPal",
  }
  return [
    `Hola M90, soy ${opts.customerName}.`,
    `Pedido ${opts.orderNumber}:`,
    "",
    itemsLines,
    "",
    `Total: $${opts.total.toFixed(0)}`,
    `Pago: ${paymentLabel[opts.paymentMethod] ?? opts.paymentMethod}`,
    `Dirección: ${opts.shippingSummary}`,
  ].join("\n")
}

export async function POST(request: Request) {
  let body: OrderRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  // Basic validation
  if (!body.items || body.items.length === 0)
    return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 })
  if (!body.customer?.name || !body.customer?.phone)
    return NextResponse.json(
      { error: "Faltan datos del cliente (nombre y teléfono)." },
      { status: 400 }
    )
  if (!body.shippingAddress?.street || !body.shippingAddress?.municipality)
    return NextResponse.json(
      { error: "Falta la dirección de entrega." },
      { status: 400 }
    )
  if (!body.paymentMethod)
    return NextResponse.json(
      { error: "Selecciona un método de pago." },
      { status: 400 }
    )

  // Look up variants + their products
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
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(
      variantIds.length === 1
        ? eq(variants.id, variantIds[0])
        : sql`${variants.id} = ANY(${variantIds})`
    )

  if (variantRows.length !== variantIds.length) {
    return NextResponse.json(
      { error: "Uno o más productos del carrito no están disponibles." },
      { status: 400 }
    )
  }
  const unpublished = variantRows.find((v) => v.productStatus !== "published")
  if (unpublished) {
    return NextResponse.json(
      { error: "Uno o más productos no están publicados." },
      { status: 400 }
    )
  }

  // Build snapshot items + totals
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
    }
  })
  const subtotal = snapshots.reduce(
    (s, it) => s + it.unitPrice * it.quantity,
    0
  )

  const country = body.customer.country ?? "CU"
  const isDiaspora = country !== "CU"
  const shippingCost = shippingCostForProvince(
    body.shippingAddress.province,
    isDiaspora
  )
  const total = subtotal + shippingCost

  // Create / find customer (by phone)
  let customerId: string
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, body.customer.phone))
    .limit(1)
  if (existing.length > 0) {
    customerId = existing[0].id
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

  // Create address
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

  // Create order + items in a transaction
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
      discountTotal: "0",
      total: String(total),
      currency: "USD",
      shippingAddressId: addressId,
      shippingMethod: "Mensajería propia",
      paymentMethod: body.paymentMethod,
      notesCustomer: body.notesCustomer ?? null,
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
      }))
    )
  })

  // Compose WhatsApp link
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

  const message = buildWhatsAppMessage({
    orderNumber,
    items: snapshots.map((s) => ({
      name: s.productName,
      size: s.size,
      quantity: s.quantity,
      subtotal: s.unitPrice * s.quantity,
    })),
    total,
    customerName: body.customer.name,
    shippingSummary,
    paymentMethod: body.paymentMethod,
  })

  const whatsappNumber =
    process.env.M90_WHATSAPP_NUMBER?.replace(/[^\d]/g, "") ?? "5351191461"
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`

  return NextResponse.json({
    id: orderId,
    orderNumber,
    total,
    subtotal,
    shippingCost,
    whatsappUrl,
  })
}
