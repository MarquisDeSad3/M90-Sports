import "server-only"
import { cookies } from "next/headers"
import { hashPassword, verifyPassword } from "./password"
import {
  createSession,
  deleteSession,
  validateSession,
  type AuthenticatedAdmin,
} from "./session"

export const SESSION_COOKIE = "m90_admin_session"

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  try {
    return await validateSession(token)
  } catch (err) {
    // Local dev without DATABASE_URL → behave as anonymous so /admin/login
    // still renders and we don't crash the whole route tree.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] getCurrentAdmin failed:", err)
      return null
    }
    throw err
  }
}

export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error("UNAUTHORIZED")
  }
  return admin
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  validateSession,
}
export type { AuthenticatedAdmin }
