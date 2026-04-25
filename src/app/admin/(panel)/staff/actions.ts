"use server"

import { revalidatePath } from "next/cache"
import { and, eq, isNull, ne } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { z } from "zod"
import { db } from "@/lib/db"
import { adminUsers } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { requireAdminRole } from "@/lib/auth"
import { deleteAllSessionsForAdmin } from "@/lib/auth/session"
import type { AdminRole } from "@/lib/auth/roles"

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const ROLE_ENUM = z.enum(["owner", "manager", "staff", "viewer"])

const baseSchema = {
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(120),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  role: ROLE_ENUM,
}

const createSchema = z
  .object({
    ...baseSchema,
    password: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(120, "Demasiado largo"),
  })
  .strict()

const updateSchema = z
  .object({
    id: z.string().min(1),
    name: baseSchema.name,
    role: ROLE_ENUM,
  })
  .strict()

const passwordResetSchema = z
  .object({
    id: z.string().min(1),
    password: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(120),
  })
  .strict()

/** Read FormData into the shape Zod expects, with cheap normalization. */
function readForm(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    password: String(formData.get("password") ?? ""),
    id: String(formData.get("id") ?? ""),
  }
}

/**
 * Confirm there's at least one OTHER active owner besides `excludingId`.
 * Used to prevent demoting/deleting the last owner — that would lock
 * everyone out of owner-only routes (settings, staff management).
 */
async function hasOtherActiveOwner(excludingId: string): Promise<boolean> {
  const others = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.role, "owner"),
        isNull(adminUsers.deletedAt),
        ne(adminUsers.id, excludingId),
      ),
    )
    .limit(1)
  return others.length > 0
}

export async function createStaffAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let acting
  try {
    acting = await requireAdminRole("owner")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Solo el dueño puede crear cuentas."
          : "No autenticado.",
    }
  }

  const parsed = createSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Datos inválidos." }
  }
  const input = parsed.data

  // Refuse creating another owner from anyone but the very first owner.
  // Multiple owners are allowed but must be a deliberate choice — we make
  // it unambiguous by requiring the acting admin to literally be an owner
  // (already enforced) and call out the elevation in the audit log later.
  if (input.role === "owner" && acting.admin.role !== "owner") {
    return { ok: false, error: "Solo otro dueño puede crear un dueño." }
  }

  // Make sure the email isn't already taken (case-insensitive — we
  // lowercased it above).
  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, input.email))
    .limit(1)
  if (existing.length > 0) {
    return { ok: false, error: "Ya existe un usuario con ese email." }
  }

  try {
    const passwordHash = await hashPassword(input.password)
    await db.insert(adminUsers).values({
      id: `adm_${createId()}`,
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role as AdminRole,
      invitedBy: acting.admin.id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[staff] create failed:", msg)
    return { ok: false, error: "No se pudo crear el usuario." }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}

export async function updateStaffAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let acting
  try {
    acting = await requireAdminRole("owner")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Solo el dueño puede editar cuentas."
          : "No autenticado.",
    }
  }

  const parsed = updateSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Datos inválidos." }
  }
  const input = parsed.data

  // Look up the target so we can compare the OLD and NEW role for the
  // owner-protection check below.
  const target = await db
    .select({
      id: adminUsers.id,
      role: adminUsers.role,
      deletedAt: adminUsers.deletedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, input.id))
    .limit(1)
  if (target.length === 0 || target[0]!.deletedAt) {
    return { ok: false, error: "Usuario no encontrado." }
  }

  // Don't let an owner demote themselves if they're the last owner —
  // would brick owner-only routes (settings, staff).
  if (
    input.id === acting.admin.id &&
    target[0]!.role === "owner" &&
    input.role !== "owner" &&
    !(await hasOtherActiveOwner(acting.admin.id))
  ) {
    return {
      ok: false,
      error: "No puedes degradarte: eres el único dueño.",
    }
  }

  try {
    await db
      .update(adminUsers)
      .set({
        name: input.name,
        role: input.role,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, input.id))

    // If the role changed, force the user to re-login so the new role
    // takes effect everywhere immediately. validateSession trusts the
    // role on the row but cached session info elsewhere (rare) wouldn't.
    if (target[0]!.role !== input.role) {
      await deleteAllSessionsForAdmin(input.id)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[staff] update failed:", msg)
    return { ok: false, error: "No se pudo actualizar." }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}

/**
 * Reset a user's password to a new one chosen by the owner. The owner
 * tells the user the new value out-of-band (WhatsApp, in person). Also
 * revokes all existing sessions so any active stolen cookie dies.
 */
export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("owner")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Solo el dueño puede resetear contraseñas."
          : "No autenticado.",
    }
  }

  const parsed = passwordResetSchema.safeParse(readForm(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Datos inválidos." }
  }
  const input = parsed.data

  try {
    const passwordHash = await hashPassword(input.password)
    await db
      .update(adminUsers)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, input.id))
    await deleteAllSessionsForAdmin(input.id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[staff] password reset failed:", msg)
    return { ok: false, error: "No se pudo cambiar la contraseña." }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}

export async function unlockStaffAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("owner")
  } catch {
    return { ok: false, error: "No autorizado." }
  }
  const id = String(formData.get("id") ?? "")
  if (!id) return { ok: false, error: "ID inválido." }

  try {
    await db
      .update(adminUsers)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, id))
  } catch {
    return { ok: false, error: "No se pudo desbloquear." }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}

/**
 * Soft-delete + revoke all sessions. The user is logged out instantly
 * (validateSession refuses rows with a non-null deletedAt) and we keep
 * the row so audit logs and historical orders/reviews still resolve.
 */
export async function deleteStaffAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let acting
  try {
    acting = await requireAdminRole("owner")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Solo el dueño puede eliminar cuentas."
          : "No autenticado.",
    }
  }

  const id = String(formData.get("id") ?? "")
  if (!id) return { ok: false, error: "ID inválido." }

  if (id === acting.admin.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta." }
  }

  // Block deleting the last owner.
  const target = await db
    .select({ id: adminUsers.id, role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1)
  if (target.length === 0) {
    return { ok: false, error: "Usuario no encontrado." }
  }
  if (
    target[0]!.role === "owner" &&
    !(await hasOtherActiveOwner(id))
  ) {
    return { ok: false, error: "No puedes eliminar al único dueño." }
  }

  try {
    await db
      .update(adminUsers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
    await deleteAllSessionsForAdmin(id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[staff] delete failed:", msg)
    return { ok: false, error: "No se pudo eliminar." }
  }

  revalidatePath("/admin/staff")
  return { ok: true }
}
