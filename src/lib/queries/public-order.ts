import "server-only"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  addresses,
  customers,
  orderItems,
  orders,
  payments,
} from "@/lib/db/schema"

export type PublicOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export type PublicPaymentStatus =
  | "unpaid"
  | "proof_uploaded"
  | "verified"
  | "failed"
  | "refunded"

export type PublicFulfillmentStatus =
  | "unfulfilled"
  | "preparing"
  | "shipped"
  | "delivered"
  | "returned"

export type PublicPaymentMethod =
  | "transfermovil"
  | "cash_on_delivery"
  | "zelle"
  | "paypal"

export interface PublicOrderItem {
  productName: string
  variantSize: string | null
  imageUrl: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface PublicOrderShipping {
  province: string | null
  municipality: string | null
  street: string | null
  reference: string | null
  recipientName: string | null
  recipientPhone: string | null
}

export interface PublicOrderPayment {
  id: string
  method: PublicPaymentMethod
  status: PublicPaymentStatus
  amount: number
  proofUrl: string | null
  proofUploadedAt: Date | null
  transactionRef: string | null
  rejectionReason: string | null
  verifiedAt: Date | null
  createdAt: Date
}

export interface PublicOrder {
  id: string
  orderNumber: string
  status: PublicOrderStatus
  paymentStatus: PublicPaymentStatus
  fulfillmentStatus: PublicFulfillmentStatus
  paymentMethod: PublicPaymentMethod | null
  subtotal: number
  shippingCost: number
  discountTotal: number
  total: number
  currency: string
  depositAmount: number | null
  balanceAmount: number | null
  notesCustomer: string | null
  placedAt: Date
  paidAt: Date | null
  shippedAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
  cancelledReason: string | null
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  shipping: PublicOrderShipping | null
  items: PublicOrderItem[]
  payments: PublicOrderPayment[]
}

/**
 * Look up an order by its public order number for the
 * /pedido/[number] tracking page. Anything sensitive that an admin
 * would care about (notes_internal, sourcing notes) is intentionally
 * excluded from the public shape.
 */
export async function getPublicOrder(
  orderNumber: string,
): Promise<PublicOrder | null> {
  if (!orderNumber || orderNumber.length < 4 || orderNumber.length > 40) {
    return null
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(
      and(
        isNull(orders.deletedAt),
        eq(orders.orderNumber, orderNumber),
      ),
    )
    .limit(1)

  const order = orderRows[0]
  if (!order) return null

  const [items, paymentRows, customerRow, shippingAddress] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(orderItems.createdAt),
    db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(payments.createdAt),
    order.customerId
      ? db
          .select()
          .from(customers)
          .where(eq(customers.id, order.customerId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    order.shippingAddressId
      ? db
          .select()
          .from(addresses)
          .where(eq(addresses.id, order.shippingAddressId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ])

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as PublicOrderStatus,
    paymentStatus: order.paymentStatus as PublicPaymentStatus,
    fulfillmentStatus: order.fulfillmentStatus as PublicFulfillmentStatus,
    paymentMethod: (order.paymentMethod as PublicPaymentMethod) ?? null,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discountTotal: Number(order.discountTotal),
    total: Number(order.total),
    currency: order.currency,
    depositAmount: order.depositAmount ? Number(order.depositAmount) : null,
    balanceAmount: order.balanceAmount ? Number(order.balanceAmount) : null,
    notesCustomer: order.notesCustomer,
    placedAt: order.placedAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancelledReason: order.cancelledReason,
    customerName: customerRow?.name ?? null,
    customerPhone: customerRow?.phone ?? null,
    customerEmail: customerRow?.email ?? null,
    shipping: shippingAddress
      ? {
          province: shippingAddress.province ?? null,
          municipality: shippingAddress.municipality ?? null,
          street: shippingAddress.street ?? null,
          reference: shippingAddress.reference ?? null,
          recipientName: shippingAddress.recipientName ?? null,
          recipientPhone: shippingAddress.phone ?? null,
        }
      : null,
    items: items.map((i) => ({
      productName: i.productName,
      variantSize: i.variantSize,
      imageUrl: i.imageUrl,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
    payments: paymentRows.map((p) => ({
      id: p.id,
      method: p.method as PublicPaymentMethod,
      status: p.status as PublicPaymentStatus,
      amount: Number(p.amount),
      proofUrl: p.proofUrl,
      proofUploadedAt: p.proofUploadedAt,
      transactionRef: p.transactionRef,
      rejectionReason: p.rejectionReason,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
    })),
  }
}
