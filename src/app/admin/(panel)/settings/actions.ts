"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminRole } from "@/lib/auth"
import { saveSiteSettings, type SiteSettings } from "@/lib/queries/settings"

/**
 * Validation schema for the settings form. Mirrors the SiteSettings
 * shape but with hard caps on every string. We trust this is editor-only
 * input but bound it anyway — defense in depth, and it catches typos.
 */
const settingsSchema = z.object({
  business: z
    .object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(120),
      whatsappNumber: z
        .string()
        .trim()
        .regex(/^\+?[\d\s().-]{6,20}$/, "Número inválido")
        .max(20),
      whatsappDefaultMessage: z.string().trim().max(500),
    })
    .strict(),
  payments: z
    .object({
      transfermovilEnabled: z.boolean(),
      transfermovilAccount: z.string().trim().max(80),
      cashOnDeliveryEnabled: z.boolean(),
      zelleEnabled: z.boolean(),
      zelleEmail: z.string().trim().max(120),
      paypalEnabled: z.boolean(),
      paypalEmail: z.string().trim().max(120),
    })
    .strict(),
  shipping: z
    .object({
      habanaCost: z.coerce.number().min(0).max(1000),
      mayabequeCost: z.coerce.number().min(0).max(1000),
      artemisaCost: z.coerce.number().min(0).max(1000),
      matanzasCost: z.coerce.number().min(0).max(1000),
      pinarCost: z.coerce.number().min(0).max(1000),
      diasporaSurcharge: z.coerce.number().min(0).max(1000),
    })
    .strict(),
  social: z
    .object({
      instagram: z.string().trim().max(200),
      facebook: z.string().trim().max(200),
      tiktok: z.string().trim().max(200),
    })
    .strict(),
  preorder: z
    .object({
      depositPercentage: z.coerce.number().min(0).max(100),
    })
    .strict(),
}) satisfies z.ZodType<SiteSettings>

export interface SaveSettingsState {
  ok: boolean
  message: string
}

/**
 * Read the entire settings form from FormData and persist it. We intentionally
 * write the full struct on every save — the UI shows everything in one panel,
 * and per-field saves would multiply round-trips for no win.
 */
export async function saveSettingsAction(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  let admin
  try {
    admin = await requireAdminRole("owner")
  } catch (err) {
    return {
      ok: false,
      message:
        (err as Error)?.message === "FORBIDDEN"
          ? "No tienes permisos para cambiar la configuración."
          : "No autenticado.",
    }
  }

  const raw: SiteSettings = {
    business: {
      name: String(formData.get("business.name") ?? ""),
      email: String(formData.get("business.email") ?? ""),
      whatsappNumber: String(formData.get("business.whatsappNumber") ?? ""),
      whatsappDefaultMessage: String(
        formData.get("business.whatsappDefaultMessage") ?? "",
      ),
    },
    payments: {
      transfermovilEnabled:
        formData.get("payments.transfermovilEnabled") === "on",
      transfermovilAccount: String(
        formData.get("payments.transfermovilAccount") ?? "",
      ),
      cashOnDeliveryEnabled:
        formData.get("payments.cashOnDeliveryEnabled") === "on",
      zelleEnabled: formData.get("payments.zelleEnabled") === "on",
      zelleEmail: String(formData.get("payments.zelleEmail") ?? ""),
      paypalEnabled: formData.get("payments.paypalEnabled") === "on",
      paypalEmail: String(formData.get("payments.paypalEmail") ?? ""),
    },
    shipping: {
      habanaCost: Number(formData.get("shipping.habanaCost") ?? 0),
      mayabequeCost: Number(formData.get("shipping.mayabequeCost") ?? 0),
      artemisaCost: Number(formData.get("shipping.artemisaCost") ?? 0),
      matanzasCost: Number(formData.get("shipping.matanzasCost") ?? 0),
      pinarCost: Number(formData.get("shipping.pinarCost") ?? 0),
      diasporaSurcharge: Number(formData.get("shipping.diasporaSurcharge") ?? 0),
    },
    social: {
      instagram: String(formData.get("social.instagram") ?? ""),
      facebook: String(formData.get("social.facebook") ?? ""),
      tiktok: String(formData.get("social.tiktok") ?? ""),
    },
    preorder: {
      depositPercentage: Number(formData.get("preorder.depositPercentage") ?? 30),
    },
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      message: first
        ? `${first.path.join(".")}: ${first.message}`
        : "Datos inválidos.",
    }
  }

  try {
    await saveSiteSettings(parsed.data, admin.admin.id)
    revalidatePath("/admin/settings")
    return { ok: true, message: "Cambios guardados." }
  } catch (err) {
    // Log only the message — the full error can carry the values we
    // were trying to write (e.g. payment account numbers).
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[settings] save failed:", msg)
    return { ok: false, message: "No se pudo guardar. Intenta de nuevo." }
  }
}
