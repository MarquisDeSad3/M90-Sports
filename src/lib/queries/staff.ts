import "server-only"
import { asc, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminUsers } from "@/lib/db/schema"
import type { AdminRole } from "@/lib/auth/roles"

/**
 * Snapshot of an admin user for the /admin/staff list. We never expose
 * the password hash, the raw lockout window, or the 2FA secret — only
 * the booleans/timestamps a manager actually needs to decide whether
 * to reset, unlock, or revoke the account.
 */
export interface StaffMember {
  id: string
  email: string
  name: string
  role: AdminRole
  lastLoginAt: Date | null
  lastLoginIp: string | null
  failedLoginAttempts: number
  lockedUntil: Date | null
  twoFactorEnabled: boolean
  isLocked: boolean
  createdAt: Date
}

export async function getStaff(): Promise<StaffMember[]> {
  try {
    const rows = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        lastLoginAt: adminUsers.lastLoginAt,
        lastLoginIp: adminUsers.lastLoginIp,
        failedLoginAttempts: adminUsers.failedLoginAttempts,
        lockedUntil: adminUsers.lockedUntil,
        twoFactorEnabled: adminUsers.twoFactorEnabled,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .where(isNull(adminUsers.deletedAt))
      .orderBy(asc(adminUsers.createdAt))

    const now = new Date()
    return rows.map((r) => ({
      ...r,
      role: r.role as AdminRole,
      isLocked: r.lockedUntil ? r.lockedUntil > now : false,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[staff] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function countOwners(): Promise<number> {
  const result = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.role, "owner"))
  // Filter out soft-deleted in JS to avoid composing complex WHERE.
  return result.length
}
