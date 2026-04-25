"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { adminUsers } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/auth"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { deleteAllSessionsForAdmin } from "@/lib/auth/session"

export type ActionState = {
  ok: boolean
  message: string
  /** Marks which form produced the message so we render it next to the right
   * one (we share a single state for both forms but want only one to react). */
  form?: "profile" | "password"
}

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    photoUrl: z
      .string()
      .trim()
      .max(500, "URL demasiado larga")
      .url("Debe ser una URL válida (https://…)")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .strict()

const passwordSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual"),
    next: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(120, "Demasiado largo"),
    confirm: z.string(),
  })
  .strict()
  .refine((d) => d.next === d.confirm, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirm"],
  })

/** Update name + optional photoUrl on the *currently logged-in* admin. */
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let acting
  try {
    acting = await requireAdmin()
  } catch {
    return { ok: false, message: "No autenticado.", form: "profile" }
  }

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? "") || undefined,
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      message: first?.message ?? "Datos inválidos.",
      form: "profile",
    }
  }

  try {
    await db
      .update(adminUsers)
      .set({
        name: parsed.data.name,
        photoUrl: parsed.data.photoUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, acting.admin.id))
  } catch {
    return {
      ok: false,
      message: "No se pudo guardar el perfil.",
      form: "profile",
    }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/settings/profile")
  return { ok: true, message: "Perfil actualizado.", form: "profile" }
}

/**
 * Change own password. Verifies the current value first to prevent a
 * stolen-session attacker from swapping the password silently. Wipes
 * every session afterwards so the user is forced to re-login with the
 * new credentials (kicks out any other active session too).
 */
export async function changeOwnPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let acting
  try {
    acting = await requireAdmin()
  } catch {
    return { ok: false, message: "No autenticado.", form: "password" }
  }

  const parsed = passwordSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      message: first?.message ?? "Datos inválidos.",
      form: "password",
    }
  }

  // Re-fetch the row to read the password hash (the session payload doesn't
  // carry it, and shouldn't).
  const rows = await db
    .select({ passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, acting.admin.id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    return { ok: false, message: "Usuario no encontrado.", form: "password" }
  }

  const ok = await verifyPassword(parsed.data.current, row.passwordHash)
  if (!ok) {
    return {
      ok: false,
      message: "La contraseña actual no es correcta.",
      form: "password",
    }
  }

  try {
    const newHash = await hashPassword(parsed.data.next)
    await db
      .update(adminUsers)
      .set({
        passwordHash: newHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, acting.admin.id))
    await deleteAllSessionsForAdmin(acting.admin.id)
  } catch {
    return {
      ok: false,
      message: "No se pudo cambiar la contraseña.",
      form: "password",
    }
  }

  return {
    ok: true,
    message: "Contraseña cambiada. Vuelve a iniciar sesión.",
    form: "password",
  }
}
