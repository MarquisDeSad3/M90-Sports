import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"

const PROVINCE_LABEL: Record<string, string> = {
  LA_HABANA: "La Habana",
  PINAR_DEL_RIO: "Pinar del Río",
  ARTEMISA: "Artemisa",
  MAYABEQUE: "Mayabeque",
  MATANZAS: "Matanzas",
}

// Last-resort fallback when no DB zone covers the province. Same numbers
// as the original hardcoded table from before shipping zones existed.
const LEGACY_FALLBACK: Record<string, number> = {
  LA_HABANA: 5,
  MAYABEQUE: 5,
  ARTEMISA: 8,
  MATANZAS: 8,
  PINAR_DEL_RIO: 10,
}
const LEGACY_DEFAULT = 12
const DIASPORA_SURCHARGE = 3

export interface ShippingResolution {
  cost: number
  zoneId: string | null
  zoneName: string | null
  freeShippingApplied: boolean
}

/**
 * Pick the shipping cost for an order. Prefers an active zone in the
 * `shipping_zones` table that lists this province, falling back to the
 * legacy hardcoded numbers if no zone matches (so checkout never breaks
 * when Ever hasn't configured zones yet).
 *
 * Honors `freeShippingThreshold` when the subtotal qualifies. The
 * diaspora surcharge stays on top — we use it as a "international
 * handling" markup, not a province-level fee.
 */
export async function resolveShippingCost({
  provinceEnumValue,
  subtotal,
  isDiaspora,
}: {
  provinceEnumValue: string
  subtotal: number
  isDiaspora: boolean
}): Promise<ShippingResolution> {
  const friendly = PROVINCE_LABEL[provinceEnumValue] ?? provinceEnumValue

  let zoneCost: number | null = null
  let zoneId: string | null = null
  let zoneName: string | null = null
  let freeShippingApplied = false

  try {
    const rows = await db
      .select({
        id: shippingZones.id,
        name: shippingZones.name,
        provinces: shippingZones.provinces,
        baseCost: shippingZones.baseCost,
        freeShippingThreshold: shippingZones.freeShippingThreshold,
      })
      .from(shippingZones)
      .where(eq(shippingZones.active, true))

    const matchingZone = rows.find((z) => {
      const provs = Array.isArray(z.provinces) ? (z.provinces as string[]) : []
      return provs.includes(friendly) || provs.includes(provinceEnumValue)
    })

    if (matchingZone) {
      zoneId = matchingZone.id
      zoneName = matchingZone.name
      zoneCost = Number(matchingZone.baseCost)
      const threshold = matchingZone.freeShippingThreshold
        ? Number(matchingZone.freeShippingThreshold)
        : null
      if (threshold !== null && subtotal >= threshold) {
        zoneCost = 0
        freeShippingApplied = true
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[shipping] zone lookup failed:", err)
    }
    // Fall through to legacy.
  }

  let cost: number
  if (zoneCost !== null) {
    cost = zoneCost
  } else {
    cost = LEGACY_FALLBACK[provinceEnumValue] ?? LEGACY_DEFAULT
  }

  if (isDiaspora && !freeShippingApplied) {
    cost += DIASPORA_SURCHARGE
  }

  return { cost, zoneId, zoneName, freeShippingApplied }
}
