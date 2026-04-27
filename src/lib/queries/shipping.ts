import "server-only"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"

export interface ShippingZoneRecord {
  id: string
  name: string
  provinces: string[]
  baseCost: number
  freeShippingThreshold: number | null
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export async function getShippingZones(): Promise<ShippingZoneRecord[]> {
  try {
    const rows = await db
      .select()
      .from(shippingZones)
      .orderBy(asc(shippingZones.name))

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      provinces: Array.isArray(r.provinces) ? (r.provinces as string[]) : [],
      baseCost: Number(r.baseCost),
      freeShippingThreshold: r.freeShippingThreshold
        ? Number(r.freeShippingThreshold)
        : null,
      estimatedDaysMin: r.estimatedDaysMin,
      estimatedDaysMax: r.estimatedDaysMax,
      active: r.active,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[shipping] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function getShippingZone(
  id: string,
): Promise<ShippingZoneRecord | null> {
  const rows = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.id, id))
    .limit(1)
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    name: r.name,
    provinces: Array.isArray(r.provinces) ? (r.provinces as string[]) : [],
    baseCost: Number(r.baseCost),
    freeShippingThreshold: r.freeShippingThreshold
      ? Number(r.freeShippingThreshold)
      : null,
    estimatedDaysMin: r.estimatedDaysMin,
    estimatedDaysMax: r.estimatedDaysMax,
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** Cuban provinces for the multi-select. */
export const CUBA_PROVINCES = [
  "Pinar del Río",
  "Artemisa",
  "La Habana",
  "Mayabeque",
  "Matanzas",
  "Cienfuegos",
  "Villa Clara",
  "Sancti Spíritus",
  "Ciego de Ávila",
  "Camagüey",
  "Las Tunas",
  "Holguín",
  "Granma",
  "Santiago de Cuba",
  "Guantánamo",
  "Isla de la Juventud",
] as const
