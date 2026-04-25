import "server-only"
import { inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"

/**
 * Strongly-typed "shape" of the editable site settings. Values live in
 * the settings table as JSONB rows keyed by the dotted name. The struct
 * here is the source of truth for defaults — adding a field just means
 * adding a default and a form row, no migration.
 */
export interface SiteSettings {
  business: {
    name: string
    email: string
    whatsappNumber: string
    whatsappDefaultMessage: string
  }
  payments: {
    transfermovilEnabled: boolean
    transfermovilAccount: string
    cashOnDeliveryEnabled: boolean
    zelleEnabled: boolean
    zelleEmail: string
    paypalEnabled: boolean
    paypalEmail: string
  }
  shipping: {
    habanaCost: number
    mayabequeCost: number
    artemisaCost: number
    matanzasCost: number
    pinarCost: number
    diasporaSurcharge: number
  }
  social: {
    instagram: string
    facebook: string
    tiktok: string
  }
}

export const DEFAULT_SETTINGS: SiteSettings = {
  business: {
    name: "M90 Sports",
    email: "ever@m90-sports.com",
    whatsappNumber: "5351191461",
    whatsappDefaultMessage: "Hola M90, me interesa una camiseta.",
  },
  payments: {
    transfermovilEnabled: true,
    transfermovilAccount: "",
    cashOnDeliveryEnabled: true,
    zelleEnabled: true,
    zelleEmail: "",
    paypalEnabled: true,
    paypalEmail: "",
  },
  shipping: {
    habanaCost: 5,
    mayabequeCost: 5,
    artemisaCost: 8,
    matanzasCost: 8,
    pinarCost: 10,
    diasporaSurcharge: 3,
  },
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
}

/**
 * Flatten the nested struct to dotted keys (e.g. "business.name") so we
 * can store one row per leaf and merge updates without re-writing the
 * whole document.
 */
function flatten(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key))
    } else {
      out[key] = v
    }
  }
  return out
}

/** Inverse of flatten — turns dotted keys back into a nested struct. */
function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".")
  let cur: Record<string, unknown> = target
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!
    if (!(p in cur) || typeof cur[p] !== "object" || cur[p] === null) {
      cur[p] = {}
    }
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]!] = value
}

/**
 * Load settings, layering DB rows on top of the defaults. Missing keys
 * fall through to the defaults so the UI never shows undefined.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  let rows: { key: string; value: unknown }[] = []
  try {
    rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[settings] DB unavailable in dev:", err)
      return DEFAULT_SETTINGS
    }
    throw err
  }

  // Start from defaults, override with DB rows.
  const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as Record<
    string,
    unknown
  >
  for (const r of rows) {
    setPath(merged, r.key, r.value)
  }
  return merged as unknown as SiteSettings
}

/**
 * Persist a partial settings update. Only the keys present in `patch`
 * are written — anything else stays at its current value (or default if
 * never set).
 */
export async function saveSiteSettings(
  patch: Partial<SiteSettings>,
  updatedBy: string | null,
): Promise<void> {
  const flat = flatten(patch as Record<string, unknown>)
  const entries = Object.entries(flat)
  if (entries.length === 0) return

  // Upsert each key. Drizzle's onConflictDoUpdate gives us the SQL
  // semantics we want (insert-or-update).
  await Promise.all(
    entries.map(([key, value]) =>
      db
        .insert(settings)
        .values({
          key,
          value: value as never,
          updatedBy,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: value as never,
            updatedBy,
            updatedAt: new Date(),
          },
        }),
    ),
  )
}

/**
 * Helper for routes that only need a couple of values, e.g. /api/orders
 * needing the WhatsApp number. Avoids loading the whole struct.
 */
export async function getSettingValues<T extends string>(
  keys: T[],
): Promise<Record<T, unknown>> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, keys))
  const out = {} as Record<T, unknown>
  for (const r of rows) {
    out[r.key as T] = r.value
  }
  return out
}
