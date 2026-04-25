import "server-only"

export type AdminRole = "owner" | "manager" | "staff" | "viewer"

/**
 * Role hierarchy for permission checks.
 * Higher rank = more privileges. owner > manager > staff > viewer.
 *
 * The rank-based check (`rankOf(actual) >= rankOf(required)`) is what
 * `requireAdminRole` uses, so most callers just pass the minimum role
 * they need and any higher role passes through.
 */
const RANK: Record<AdminRole, number> = {
  viewer: 0,
  staff: 1,
  manager: 2,
  owner: 3,
}

export function rankOf(role: AdminRole): number {
  return RANK[role]
}

/** Does `actual` meet or exceed the rank of `required`? */
export function meetsRole(actual: AdminRole, required: AdminRole): boolean {
  return RANK[actual] >= RANK[required]
}

/**
 * Convenience predicates for places where reading code matters more
 * than reusing the rank check directly (e.g. UI gating).
 */
export const isAtLeastStaff = (r: AdminRole) => meetsRole(r, "staff")
export const isAtLeastManager = (r: AdminRole) => meetsRole(r, "manager")
export const isOwner = (r: AdminRole) => r === "owner"
