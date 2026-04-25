"use server"

import { revalidatePath } from "next/cache"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

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

// Helper for deriving order_number atomically (server-side only)
export async function nextOrderNumber(): Promise<string> {
  const result = await db.execute(
    sql`SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1 AS next FROM orders`
  )
  const row = result[0] as { next?: number } | undefined
  const n = row?.next ?? 1
  return `M90-${String(n).padStart(6, "0")}`
}
