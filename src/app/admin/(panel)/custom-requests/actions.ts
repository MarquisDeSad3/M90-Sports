"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { customRequests } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

const quoteSchema = z
  .object({
    id: z.string().min(1),
    quotedPrice: z.coerce.number().min(0).max(10000),
    quoteNotes: z.string().trim().max(500).optional(),
  })
  .strict()

const noteSchema = z
  .object({
    id: z.string().min(1),
    adminNotes: z.string().trim().max(1000),
  })
  .strict()

/** Save a price quote and mark the request as `quoted`. */
export async function quoteCustomRequestAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let admin
  try {
    admin = await requireAdminRole("staff")
  } catch (err) {
    return {
      ok: false,
      error: (err as Error)?.message === "FORBIDDEN" ? "Sin permisos." : "No autenticado.",
    }
  }

  const parsed = quoteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    quotedPrice: Number(formData.get("quotedPrice") ?? 0),
    quoteNotes: String(formData.get("quoteNotes") ?? "") || undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  try {
    await db
      .update(customRequests)
      .set({
        status: "quoted",
        quotedPrice: String(parsed.data.quotedPrice),
        quoteNotes: parsed.data.quoteNotes ?? null,
        quotedBy: admin.admin.id,
        quotedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customRequests.id, parsed.data.id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[custom-requests] quote failed:", msg)
    return { ok: false, error: "No se pudo guardar la cotización." }
  }

  revalidatePath("/admin/custom-requests")
  return { ok: true }
}

/**
 * Move the request to a new status. Used for accept/reject/converted
 * via small one-button forms in the UI.
 */
export async function setCustomRequestStatusAction(
  id: string,
  status: "pending" | "quoted" | "accepted" | "rejected" | "converted",
): Promise<ActionResult> {
  try {
    await requireAdminRole("staff")
  } catch {
    return { ok: false, error: "No autorizado." }
  }
  if (!id) return { ok: false, error: "ID inválido." }
  if (!["pending", "quoted", "accepted", "rejected", "converted"].includes(status)) {
    return { ok: false, error: "Estado inválido." }
  }

  try {
    await db
      .update(customRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(customRequests.id, id))
  } catch {
    return { ok: false, error: "No se pudo actualizar." }
  }

  revalidatePath("/admin/custom-requests")
  return { ok: true }
}

export async function saveAdminNotesAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("staff")
  } catch {
    return { ok: false, error: "No autorizado." }
  }

  const parsed = noteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    adminNotes: String(formData.get("adminNotes") ?? ""),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  try {
    await db
      .update(customRequests)
      .set({ adminNotes: parsed.data.adminNotes, updatedAt: new Date() })
      .where(eq(customRequests.id, parsed.data.id))
  } catch {
    return { ok: false, error: "No se pudieron guardar las notas." }
  }
  revalidatePath("/admin/custom-requests")
  return { ok: true }
}
