import "server-only"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { shippingZones } from "@/lib/db/schema"

export interface PublicShippingZone {
  id: string
  name: string
  daysLabel: string
  highlight: boolean
}

/**
 * Active shipping zones for the home-page coverage grid. Days collapse
 * to a friendly label ("24h", "2–3d") so the UI doesn't have to know
 * about the day range internals. The zone whose name matches the
 * mensajería propia (La Habana with 24h) gets `highlight=true` so it
 * renders in the brand red.
 */
export async function getPublicShippingZones(): Promise<PublicShippingZone[]> {
  try {
    const rows = await db
      .select({
        id: shippingZones.id,
        name: shippingZones.name,
        estimatedDaysMin: shippingZones.estimatedDaysMin,
        estimatedDaysMax: shippingZones.estimatedDaysMax,
      })
      .from(shippingZones)
      .where(eq(shippingZones.active, true))
      .orderBy(
        asc(shippingZones.estimatedDaysMin),
        asc(shippingZones.name),
      )

    return rows.map((r) => {
      const min = r.estimatedDaysMin
      const max = r.estimatedDaysMax
      let daysLabel: string
      if (min === null && max === null) {
        daysLabel = "—"
      } else if (min === 1 && max === 1) {
        daysLabel = "24h"
      } else if (min !== null && max !== null && min !== max) {
        daysLabel = `${min}–${max}d`
      } else {
        const single = max ?? min ?? 0
        daysLabel = `${single}d`
      }
      return {
        id: r.id,
        name: r.name,
        daysLabel,
        highlight: min === 1 && max === 1,
      }
    })
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-shipping] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}
