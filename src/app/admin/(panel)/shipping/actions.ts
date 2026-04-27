"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

const zoneSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    provinces: z.array(z.string().min(1)).min(1).max(20),
    baseCost: z.coerce.number().min(0).max(10000),
    freeShippingThreshold: z.union([
      z.coerce.number().min(0).max(100000),
      z.literal("").transform(() => null),
      z.null(),
    ]).optional().nullable(),
    estimatedDaysMin: z.union([
      z.coerce.number().int().min(0).max(60),
      z.literal("").transform(() => null),
      z.null(),
    ]).optional().nullable(),
    estimatedDaysMax: z.union([
      z.coerce.number().int().min(0).max(60),
      z.literal("").transform(() => null),
      z.null(),
    ]).optional().nullable(),
    active: z.boolean().default(true),
  })
  .strict()

function parseProvinces(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return []
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function parseNullableNumber(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export async function saveShippingZoneAction(
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

  const parsed = zoneSchema.safeParse({
    id: formData.get("id") ? String(formData.get("id")) : undefined,
    name: String(formData.get("name") ?? ""),
    provinces: parseProvinces(formData.get("provinces")),
    baseCost: Number(formData.get("baseCost") ?? 0),
    freeShippingThreshold: parseNullableNumber(
      formData.get("freeShippingThreshold"),
    ),
    estimatedDaysMin: parseNullableNumber(formData.get("estimatedDaysMin")),
    estimatedDaysMax: parseNullableNumber(formData.get("estimatedDaysMax")),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }

  const data = parsed.data
  const daysMin = data.estimatedDaysMin ?? null
  const daysMax = data.estimatedDaysMax ?? null
  if (
    daysMin !== null &&
    daysMax !== null &&
    daysMin > daysMax
  ) {
    return { ok: false, error: "El día mínimo debe ser ≤ al máximo." }
  }

  try {
    if (data.id) {
      await db
        .update(shippingZones)
        .set({
          name: data.name,
          provinces: data.provinces,
          baseCost: String(data.baseCost),
          freeShippingThreshold:
            data.freeShippingThreshold === null
              ? null
              : String(data.freeShippingThreshold),
          estimatedDaysMin: daysMin,
          estimatedDaysMax: daysMax,
          active: data.active,
          updatedAt: new Date(),
        })
        .where(eq(shippingZones.id, data.id))
    } else {
      await db.insert(shippingZones).values({
        id: `sz_${createId()}`,
        name: data.name,
        provinces: data.provinces,
        baseCost: String(data.baseCost),
        freeShippingThreshold:
          data.freeShippingThreshold === null
            ? null
            : String(data.freeShippingThreshold),
        estimatedDaysMin: data.estimatedDaysMin,
        estimatedDaysMax: data.estimatedDaysMax,
        active: data.active,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[shipping] save failed:", msg)
    return { ok: false, error: "No se pudo guardar la zona." }
  }

  revalidatePath("/admin/shipping")
  return { ok: true }
}

export async function toggleShippingZoneAction(
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
      .update(shippingZones)
      .set({ active, updatedAt: new Date() })
      .where(eq(shippingZones.id, id))
  } catch {
    return { ok: false, error: "No se pudo cambiar el estado." }
  }
  revalidatePath("/admin/shipping")
  return { ok: true }
}

export async function deleteShippingZoneAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch {
    return { ok: false, error: "Sin permisos." }
  }
  try {
    await db.delete(shippingZones).where(eq(shippingZones.id, id))
  } catch {
    return { ok: false, error: "No se pudo eliminar." }
  }
  revalidatePath("/admin/shipping")
  return { ok: true }
}
