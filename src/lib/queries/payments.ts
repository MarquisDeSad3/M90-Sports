import "server-only"
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers, orders, payments } from "@/lib/db/schema"

export type PaymentMethod =
  | "transfermovil"
  | "cash_on_delivery"
  | "zelle"
  | "paypal"

export type PaymentRowStatus =
  | "unpaid"
  | "proof_uploaded"
  | "verified"
  | "failed"
  | "refunded"

export interface PaymentRecord {
  id: string
  orderId: string
  orderNumber: string
  orderTotal: number
  orderPlacedAt: Date
  orderPaymentStatus: PaymentRowStatus
  customerName: string | null
  customerPhone: string | null
  amount: number
  currency: string
  method: PaymentMethod
  proofUrl: string | null
  proofUploadedAt: Date | null
  transactionRef: string | null
  status: PaymentRowStatus
  rejectionReason: string | null
  verifiedAt: Date | null
  createdAt: Date
}

export interface PaymentCounts {
  pending: number
  verified: number
  rejected: number
  total: number
}

export type PaymentFilter = "pending" | "verified" | "rejected" | "all"

/**
 * List payment records the admin needs to act on. By default we
 * surface the rows that are awaiting verification (proof_uploaded);
 * the filter switch covers the other states.
 *
 * Each row is enriched with the order summary (number, total, placed
 * date) and the customer's name + phone so Ever can decide and reach
 * out from the same screen.
 */
export async function getPayments(
  filter: PaymentFilter = "pending",
): Promise<PaymentRecord[]> {
  const conditions = []
  if (filter === "pending") {
    conditions.push(eq(payments.status, "proof_uploaded"))
  } else if (filter === "verified") {
    conditions.push(eq(payments.status, "verified"))
  } else if (filter === "rejected") {
    conditions.push(eq(payments.status, "failed"))
  }

  try {
    const rows = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        proofUrl: payments.proofUrl,
        proofUploadedAt: payments.proofUploadedAt,
        transactionRef: payments.transactionRef,
        status: payments.status,
        rejectionReason: payments.rejectionReason,
        verifiedAt: payments.verifiedAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        // Pending payments are time-sensitive — newest at top.
        desc(payments.proofUploadedAt),
        desc(payments.createdAt),
      )
      .limit(200)

    if (rows.length === 0) return []

    const orderIds = rows.map((r) => r.orderId)
    const orderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        placedAt: orders.placedAt,
        paymentStatus: orders.paymentStatus,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(and(isNull(orders.deletedAt), inArray(orders.id, orderIds)))
    const orderMap = new Map(orderRows.map((o) => [o.id, o]))

    const customerIds = orderRows
      .map((o) => o.customerId)
      .filter((id): id is string => id !== null)

    const customerMap = new Map<
      string,
      { name: string; phone: string | null }
    >()
    if (customerIds.length > 0) {
      const cs = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .where(inArray(customers.id, customerIds))
      for (const c of cs) {
        customerMap.set(c.id, { name: c.name, phone: c.phone })
      }
    }

    return rows
      .map((r): PaymentRecord | null => {
        const order = orderMap.get(r.orderId)
        if (!order) return null
        const customer = order.customerId
          ? customerMap.get(order.customerId)
          : null
        return {
          id: r.id,
          orderId: r.orderId,
          orderNumber: order.orderNumber,
          orderTotal: Number(order.total),
          orderPlacedAt: order.placedAt,
          orderPaymentStatus: order.paymentStatus as PaymentRowStatus,
          customerName: customer?.name ?? null,
          customerPhone: customer?.phone ?? null,
          amount: Number(r.amount),
          currency: r.currency,
          method: r.method as PaymentMethod,
          proofUrl: r.proofUrl ?? null,
          proofUploadedAt: r.proofUploadedAt ?? null,
          transactionRef: r.transactionRef ?? null,
          status: r.status as PaymentRowStatus,
          rejectionReason: r.rejectionReason ?? null,
          verifiedAt: r.verifiedAt ?? null,
          createdAt: r.createdAt,
        }
      })
      .filter((r): r is PaymentRecord => r !== null)
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[payments] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function getPaymentCounts(): Promise<PaymentCounts> {
  try {
    const result = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where ${payments.status} = 'proof_uploaded')::int`,
        verified: sql<number>`count(*) filter (where ${payments.status} = 'verified')::int`,
        rejected: sql<number>`count(*) filter (where ${payments.status} = 'failed')::int`,
      })
      .from(payments)

    return {
      total: result[0]?.total ?? 0,
      pending: result[0]?.pending ?? 0,
      verified: result[0]?.verified ?? 0,
      rejected: result[0]?.rejected ?? 0,
    }
  } catch {
    return { total: 0, pending: 0, verified: 0, rejected: 0 }
  }
}
