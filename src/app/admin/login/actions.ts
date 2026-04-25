"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminUsers } from "@/lib/db/schema"
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth"
import { cookies } from "next/headers"

export type LoginState = {
  error?: string
  success?: boolean
} | null

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." }
  }

  // Look up admin
  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      passwordHash: adminUsers.passwordHash,
      lockedUntil: adminUsers.lockedUntil,
      failedLoginAttempts: adminUsers.failedLoginAttempts,
      deletedAt: adminUsers.deletedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  const user = rows[0]

  // Generic message — never disclose if email exists or not
  const GENERIC_ERROR = "Credenciales inválidas."

  if (!user || user.deletedAt) {
    // Constant-time-ish wait so timing doesn't leak account existence
    await verifyPassword(password, "scrypt$16384$8$1$00$00")
    return { error: GENERIC_ERROR }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      error: "Cuenta bloqueada temporalmente por múltiples intentos fallidos. Espera unos minutos.",
    }
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1
    const lockUntil =
      newAttempts >= 5 ? new Date(Date.now() + 10 * 60 * 1000) : null
    await db
      .update(adminUsers)
      .set({
        failedLoginAttempts: newAttempts,
        lockedUntil: lockUntil,
      })
      .where(eq(adminUsers.id, user.id))
    return { error: GENERIC_ERROR }
  }

  // Reset attempts on success
  await db
    .update(adminUsers)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(adminUsers.id, user.id))

  const h = await headers()
  const ua = h.get("user-agent")
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null

  const { token, expiresAt } = await createSession(user.id, {
    userAgent: ua,
    ip,
  })
  await setSessionCookie(token, expiresAt)

  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await deleteSession(token).catch(() => {})
  }
  await clearSessionCookie()
  redirect("/admin/login")
}
