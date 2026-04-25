import "server-only"
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  addresses,
  customers,
  orderItems,
  orders,
  payments,
} from "@/lib/db/schema"
import type {
  MockOrder,
  MockOrderItem,
  MockShippingAddress,
  OrderStatus,
  PaymentMethodType,
  OrderSource,
} from "@/lib/mock-orders"

export interface OrderFilters {
  status?: OrderStatus | "all" | "needs_action"
  search?: string
  limit?: number
  offset?: number
}

export async function getOrders(filters: OrderFilters = {}): Promise<MockOrder[]> {
  const conditions = [isNull(orders.deletedAt)]

  if (filters.status && filters.status !== "all") {
    if (filters.status === "needs_action") {
      conditions.push(
        or(
          eq(orders.status, "pending"),
          eq(orders.paymentStatus, "proof_uploaded")
        )!
      )
    } else {
      conditions.push(eq(orders.status, filters.status as never))
    }
  }
  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        ilike(orders.orderNumber, q),
        ilike(orders.notesCustomer, q),
        ilike(orders.notesInternal, q)
      )!
    )
  }

  const where = and(...conditions)

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      subtotal: orders.subtotal,
      shippingCost: orders.shippingCost,
      discountTotal: orders.discountTotal,
      total: orders.total,
      currency: orders.currency,
      shippingMethod: orders.shippingMethod,
      paymentMethod: orders.paymentMethod,
      notesCustomer: orders.notesCustomer,
      notesInternal: orders.notesInternal,
      couponCode: orders.couponCode,
      placedAt: orders.placedAt,
      paidAt: orders.paidAt,
      shippedAt: orders.shippedAt,
      deliveredAt: orders.deliveredAt,
      cancelledAt: orders.cancelledAt,
      cancelledReason: orders.cancelledReason,
      createdAt: orders.createdAt,
      customerId: orders.customerId,
      shippingAddressId: orders.shippingAddressId,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.placedAt))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0)

  if (rows.length === 0) return []

  const customerIds = [
    ...new Set(rows.map((r) => r.customerId).filter(Boolean) as string[]),
  ]
  const addressIds = [
    ...new Set(rows.map((r) => r.shippingAddressId).filter(Boolean) as string[]),
  ]
  const orderIds = rows.map((r) => r.id)

  const customersData = customerIds.length
    ? await db
        .select()
        .from(customers)
        .where(or(...customerIds.map((id) => eq(customers.id, id)))!)
    : []
  const customersMap = new Map(customersData.map((c) => [c.id, c]))

  const addressesData = addressIds.length
    ? await db
        .select()
        .from(addresses)
        .where(or(...addressIds.map((id) => eq(addresses.id, id)))!)
    : []
  const addressesMap = new Map(addressesData.map((a) => [a.id, a]))

  const itemsData = await db
    .select()
    .from(orderItems)
    .where(or(...orderIds.map((id) => eq(orderItems.orderId, id)))!)
  const itemsByOrder = new Map<string, typeof itemsData>()
  for (const it of itemsData) {
    const list = itemsByOrder.get(it.orderId) ?? []
    list.push(it)
    itemsByOrder.set(it.orderId, list)
  }

  const paymentsData = await db
    .select()
    .from(payments)
    .where(or(...orderIds.map((id) => eq(payments.orderId, id)))!)
  const paymentsByOrder = new Map<string, typeof paymentsData>()
  for (const p of paymentsData) {
    const list = paymentsByOrder.get(p.orderId) ?? []
    list.push(p)
    paymentsByOrder.set(p.orderId, list)
  }

  return rows.map((r): MockOrder => {
    const customer = r.customerId ? customersMap.get(r.customerId) : null
    const address = r.shippingAddressId
      ? addressesMap.get(r.shippingAddressId)
      : null
    const items = itemsByOrder.get(r.id) ?? []
    const paymentsList = paymentsByOrder.get(r.id) ?? []
    const proofUploaded = paymentsList.some((p) => !!p.proofUrl)
    const paymentVerified = paymentsList.some((p) => p.status === "verified")
    const transactionRef = paymentsList.find((p) => p.transactionRef)
      ?.transactionRef

    const shippingAddress: MockShippingAddress = address
      ? {
          recipientName: address.recipientName,
          phone: address.phone,
          street: address.street,
          number: address.number ?? undefined,
          betweenStreets: address.betweenStreets ?? undefined,
          neighborhood: address.neighborhood ?? undefined,
          municipality: address.municipality,
          province: address.province,
          reference: address.reference ?? undefined,
        }
      : {
          recipientName: customer?.name ?? "—",
          phone: customer?.phone ?? "",
          street: "",
          municipality: "",
          province: "LA_HABANA",
        }

    return {
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status as OrderStatus,
      source: "manual" as OrderSource,
      customerName: customer?.name ?? "—",
      customerPhone: customer?.phone ?? "",
      customerEmail: customer?.email ?? undefined,
      isDiaspora: customer?.isDiaspora ?? false,
      country: customer?.country ?? "CU",
      items: items.map(
        (it): MockOrderItem => ({
          id: it.id,
          productId: "",
          productName: it.productName,
          team: "",
          number: undefined,
          variantSize: it.variantSize ?? "M",
          unitPrice: Number(it.unitPrice),
          quantity: it.quantity,
          subtotal: Number(it.subtotal),
        })
      ),
      subtotal: Number(r.subtotal),
      shippingCost: Number(r.shippingCost),
      discountTotal: Number(r.discountTotal),
      total: Number(r.total),
      currency: r.currency,
      shippingAddress,
      shippingMethod: r.shippingMethod ?? "Mensajería propia",
      paymentMethod: (r.paymentMethod ?? "transfermovil") as PaymentMethodType,
      paymentVerified,
      paymentTransactionRef: transactionRef ?? undefined,
      proofUploaded,
      notesCustomer: r.notesCustomer ?? undefined,
      notesInternal: r.notesInternal ?? undefined,
      couponCode: r.couponCode ?? undefined,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString(),
      shippedAt: r.shippedAt?.toISOString(),
      deliveredAt: r.deliveredAt?.toISOString(),
      cancelledAt: r.cancelledAt?.toISOString(),
      cancelReason: r.cancelledReason ?? undefined,
    }
  })
}

export async function getOrder(id: string): Promise<MockOrder | null> {
  const rows = await getOrders({ limit: 1 })
  // For single fetch, just filter from getOrders by id since the relations are
  // already wired. For higher perf we can do a dedicated query later.
  const all = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(isNull(orders.deletedAt), eq(orders.id, id)))
    .limit(1)
  if (all.length === 0) return null

  // Re-run getOrders with no filter and find the match (still simple).
  const list = await getOrders({ limit: 500 })
  return list.find((o) => o.id === id) ?? null
  void rows
}

export interface OrderCounts {
  pending: number
  verifyPayment: number
  preparing: number
  inTransit: number
  total: number
}

export async function getOrderCounts(): Promise<OrderCounts> {
  const result = await db
    .select({
      pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
      verifyPayment: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'proof_uploaded')::int`,
      preparing: sql<number>`count(*) filter (where ${orders.status} in ('confirmed','shipped'))::int`,
      inTransit: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(isNull(orders.deletedAt))

  return {
    pending: result[0]?.pending ?? 0,
    verifyPayment: result[0]?.verifyPayment ?? 0,
    preparing: result[0]?.preparing ?? 0,
    inTransit: result[0]?.inTransit ?? 0,
    total: result[0]?.total ?? 0,
  }
}
