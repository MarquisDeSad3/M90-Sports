"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function setStatus(
  id: string,
  status: "approved" | "rejected" | "pending"
): Promise<ActionResult> {
  await requireAdmin()
  try {
    await db
      .update(reviews)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
  } catch (err) {
    return {
      ok: false,
      error: "No se pudo actualizar la reseña: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/reviews")
  revalidatePath("/reviews")
  revalidatePath("/")
  return { ok: true }
}

export function approveReview(id: string) {
  return setStatus(id, "approved")
}

export function rejectReview(id: string) {
  return setStatus(id, "rejected")
}

export function restoreReview(id: string) {
  return setStatus(id, "approved")
}
