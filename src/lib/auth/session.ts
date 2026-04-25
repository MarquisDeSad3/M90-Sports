import { createHash, randomBytes } from "node:crypto"
import { eq, and, gt } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { adminSessions, adminUsers } from "@/lib/db/schema"

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function generateToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export interface SessionInfo {
  sessionId: string
  adminId: string
  expiresAt: Date
}

export async function createSession(
  adminId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const sessionId = `ses_${createId()}`

  await db.insert(adminSessions).values({
    id: sessionId,
    adminId,
    tokenHash,
    userAgent: meta.userAgent ?? null,
    ip: meta.ip ?? null,
    expiresAt,
    lastUsedAt: new Date(),
    createdAt: new Date(),
  })

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), lastLoginIp: meta.ip ?? null })
    .where(eq(adminUsers.id, adminId))

  return { token, expiresAt }
}

export interface AuthenticatedAdmin {
  sessionId: string
  admin: {
    id: string
    email: string
    name: string
    role: "owner" | "manager" | "staff" | "viewer"
    twoFactorEnabled: boolean
  }
}

export async function validateSession(token: string | undefined | null): Promise<AuthenticatedAdmin | null> {
  if (!token) return null
  const tokenHash = hashToken(token)

  const rows = await db
    .select({
      sessionId: adminSessions.id,
      adminId: adminSessions.adminId,
      expiresAt: adminSessions.expiresAt,
      admin: {
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        twoFactorEnabled: adminUsers.twoFactorEnabled,
        deletedAt: adminUsers.deletedAt,
      },
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null
  if (row.admin.deletedAt) return null

  // Slide expiration: bump last used
  await db
    .update(adminSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(adminSessions.id, row.sessionId))

  return {
    sessionId: row.sessionId,
    admin: {
      id: row.admin.id,
      email: row.admin.email,
      name: row.admin.name,
      role: row.admin.role as "owner" | "manager" | "staff" | "viewer",
      twoFactorEnabled: row.admin.twoFactorEnabled,
    },
  }
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash))
}

export async function deleteAllSessionsForAdmin(adminId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.adminId, adminId))
}
