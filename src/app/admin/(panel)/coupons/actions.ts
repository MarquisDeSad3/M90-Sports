"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

const couponSchema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, "Solo MAYÚSCULAS, números, guion y _"),
    type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
    value: z.coerce.number().min(0).max(100000),
    minPurchase: z
      .union([z.coerce.number().min(0).max(100000), z.null()])
      .nullable()
      .optional(),
    maxUses: z
      .union([z.coerce.number().int().min(1).max(100000), z.null()])
      .nullable()
      .optional(),
    maxUsesPerCustomer: z.coerce.number().int().min(1).max(100).default(1),
    expiresAt: z
      .union([z.string().min(1), z.null()])
      .nullable()
      .optional(),
    active: z.boolean().default(true),
  })
  .strict()

function parseNullableNumber(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseExpiresAt(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return null
  return raw
}

export async function saveCouponAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Sin permisos."
          : "No autenticado.",
    }
  }

  const parsed = couponSchema.safeParse({
    id: formData.get("id") ? String(formData.get("id")) : undefined,
    code: String(formData.get("code") ?? "").toUpperCase(),
    type: String(formData.get("type") ?? "percentage"),
    value: Number(formData.get("value") ?? 0),
    minPurchase: parseNullableNumber(formData.get("minPurchase")),
    maxUses: parseNullableNumber(formData.get("maxUses")),
    maxUsesPerCustomer: Number(formData.get("maxUsesPerCustomer") ?? 1),
    expiresAt: parseExpiresAt(formData.get("expiresAt")),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }

  const data = parsed.data

  // Percentage coupons can't exceed 100.
  if (data.type === "percentage" && data.value > 100) {
    return {
      ok: false,
      error: "El descuento porcentual no puede superar 100.",
    }
  }
  if (data.type === "free_shipping" && data.value !== 0) {
    // Free shipping has no value — clamp to 0 to keep the math
    // unambiguous downstream.
    data.value = 0
  }

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { ok: false, error: "Fecha de expiración inválida." }
  }

  try {
    if (data.id) {
      await db
        .update(coupons)
        .set({
          code: data.code,
          type: data.type,
          value: String(data.value),
          minPurchase:
            data.minPurchase === null || data.minPurchase === undefined
              ? null
              : String(data.minPurchase),
          maxUses: data.maxUses ?? null,
          maxUsesPerCustomer: data.maxUsesPerCustomer,
          expiresAt,
          active: data.active,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, data.id))
    } else {
      await db.insert(coupons).values({
        id: `cpn_${createId()}`,
        code: data.code,
        type: data.type,
        value: String(data.value),
        minPurchase:
          data.minPurchase === null || data.minPurchase === undefined
            ? null
            : String(data.minPurchase),
        maxUses: data.maxUses ?? null,
        maxUsesPerCustomer: data.maxUsesPerCustomer,
        expiresAt,
        active: data.active,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    if (msg.includes("coupons_code_idx") || msg.includes("duplicate")) {
      return { ok: false, error: "Ya existe un cupón con ese código." }
    }
    console.error("[coupons] save failed:", msg)
    return { ok: false, error: "No se pudo guardar el cupón." }
  }

  revalidatePath("/admin/coupons")
  return { ok: true }
}

export async function toggleCouponAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch {
    return { ok: false, error: "Sin permisos." }
  }
  try {
    await db
      .update(coupons)
      .set({ active, updatedAt: new Date() })
      .where(eq(coupons.id, id))
  } catch {
    return { ok: false, error: "No se pudo cambiar el estado." }
  }
  revalidatePath("/admin/coupons")
  return { ok: true }
}

export async function deleteCouponAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch {
    return { ok: false, error: "Sin permisos." }
  }
  try {
    await db.delete(coupons).where(eq(coupons.id, id))
  } catch {
    return { ok: false, error: "No se pudo eliminar." }
  }
  revalidatePath("/admin/coupons")
  return { ok: true }
}
