"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

const verifySchema = z
  .object({ paymentId: z.string().min(1) })
  .strict()

const rejectSchema = z
  .object({
    paymentId: z.string().min(1),
    reason: z.string().trim().min(1).max(280),
  })
  .strict()

/**
 * Approve a payment row. Marks the payment as `verified`, propagates
 * to the parent order's paymentStatus, and stamps `paid_at` so the
 * order timeline reflects the cobro.
 *
 * Idempotent — re-approving a verified row is a no-op.
 */
export async function verifyPaymentAction(
  paymentId: string,
): Promise<ActionResult> {
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

  const parsed = verifySchema.safeParse({ paymentId })
  if (!parsed.success) return { ok: false, error: "ID inválido." }

  try {
    const row = await db
      .select({ orderId: payments.orderId })
      .from(payments)
      .where(eq(payments.id, parsed.data.paymentId))
      .limit(1)
    if (row.length === 0) return { ok: false, error: "Pago no encontrado." }

    const orderId = row[0]!.orderId

    await db
      .update(payments)
      .set({
        status: "verified",
        verifiedBy: admin.admin.id,
        verifiedAt: new Date(),
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, parsed.data.paymentId))

    await db
      .update(orders)
      .set({
        paymentStatus: "verified",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[payments] verify failed:", msg)
    return { ok: false, error: "No se pudo verificar el pago." }
  }

  revalidatePath("/admin/payments")
  revalidatePath("/admin/orders")
  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Reject a payment with a reason (e.g. "comprobante ilegible",
 * "monto no coincide"). Flips the payment row to `failed`, resets the
 * order back to `unpaid` so the customer can retry the upload.
 */
export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminRole("staff")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Sin permisos."
          : "No autenticado.",
    }
  }

  const parsed = rejectSchema.safeParse({ paymentId, reason })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }

  try {
    const row = await db
      .select({ orderId: payments.orderId })
      .from(payments)
      .where(eq(payments.id, parsed.data.paymentId))
      .limit(1)
    if (row.length === 0) return { ok: false, error: "Pago no encontrado." }

    const orderId = row[0]!.orderId

    await db
      .update(payments)
      .set({
        status: "failed",
        rejectionReason: parsed.data.reason,
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, parsed.data.paymentId))

    await db
      .update(orders)
      .set({ paymentStatus: "unpaid", paidAt: null, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[payments] reject failed:", msg)
    return { ok: false, error: "No se pudo rechazar el pago." }
  }

  revalidatePath("/admin/payments")
  revalidatePath("/admin/orders")
  revalidatePath("/admin")
  return { ok: true }
}
