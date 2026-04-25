import "server-only"
import { and, eq, gt, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bannedIps, rateLimits } from "@/lib/db/schema"

/**
 * Multi-tier rate limit + ban layer.
 *
 * Why three layers instead of one big bucket:
 *  - "burst" catches the obvious flood (one IP firing as fast as it can).
 *  - "hour" catches a slow burner that paces under the burst threshold.
 *  - "day" caps the absolute volume from any single IP, even with patience.
 * A normal customer never hits any of these — checking out twice in a row
 * is fine, but 11 orders in a minute or 31 in an hour is not legitimate.
 */
export interface LimitTier {
  /** Stable name (used in the DB key). */
  name: string
  /** Window length in seconds. */
  windowSeconds: number
  /** Max hits inside the window before the request is rejected. */
  max: number
}

export const ORDER_LIMITS: LimitTier[] = [
  { name: "burst", windowSeconds: 60, max: 5 },
  { name: "hour", windowSeconds: 60 * 60, max: 15 },
  { name: "day", windowSeconds: 24 * 60 * 60, max: 60 },
]

/**
 * Auto-ban thresholds. If a single IP trips a tier this many times
 * in the given window we add it to banned_ips for `banSeconds`.
 *
 * Tripping the burst limit twice in 5 minutes is the kind of behavior
 * a real human never produces, so the ban window is long enough to
 * make scripted retries pointless.
 */
const AUTO_BAN_AFTER_BURST_TRIPS = 3
const AUTO_BAN_BURST_WINDOW_SECONDS = 5 * 60
const AUTO_BAN_SECONDS = 24 * 60 * 60

export type RateLimitDecision =
  | { ok: true }
  | {
      ok: false
      reason:
        | "banned"
        | "burst"
        | "hour"
        | "day"
        | "honeypot"
        | "too_fast"
        | "bad_client"
      retryAfterSeconds?: number
    }

/**
 * Check the IP against the active banlist. Expired bans are ignored
 * (we leave the row for forensics — pruning is a separate maintenance task).
 */
export async function isBanned(ip: string): Promise<boolean> {
  const now = new Date()
  const rows = await db
    .select({ expiresAt: bannedIps.expiresAt })
    .from(bannedIps)
    .where(eq(bannedIps.ip, ip))
    .limit(1)
  const ban = rows[0]
  if (!ban) return false
  if (!ban.expiresAt) return true // permanent
  return ban.expiresAt > now
}

/**
 * Increment counter for one (key, window). Returns the resulting count.
 * Uses an UPSERT so concurrent requests don't lose hits — the unique
 * primary key on `key` is what serializes them.
 */
async function bump(key: string, windowSeconds: number): Promise<number> {
  const resetAt = new Date(Date.now() + windowSeconds * 1000)
  const result = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        // If the existing window already expired, reset to 1; otherwise +1.
        count: sql`CASE WHEN ${rateLimits.resetAt} < NOW() THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < NOW() THEN ${resetAt.toISOString()}::timestamptz ELSE ${rateLimits.resetAt} END`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt })
  return result[0]?.count ?? 1
}

/**
 * Record an automatic ban. Called when an IP demonstrates the kind of
 * pattern (e.g. repeated burst trips, honeypot trip) that a real user
 * cannot accidentally produce.
 */
export async function banIp(
  ip: string,
  reason: string,
  seconds: number = AUTO_BAN_SECONDS,
): Promise<void> {
  const expiresAt = new Date(Date.now() + seconds * 1000)
  await db
    .insert(bannedIps)
    .values({ ip, reason, expiresAt, hits: 1 })
    .onConflictDoUpdate({
      target: bannedIps.ip,
      set: {
        reason,
        expiresAt,
        hits: sql`${bannedIps.hits} + 1`,
        lastSeenAt: new Date(),
      },
    })
}

/**
 * Run the order endpoint's full limiter chain for a given IP.
 *  1. Refuse if already banned.
 *  2. Bump every tier; the first one that exceeds its cap rejects.
 *  3. If the burst tier was tripped repeatedly in a short window,
 *     escalate to an automatic 24h ban.
 */
export async function checkOrderLimits(ip: string): Promise<RateLimitDecision> {
  if (await isBanned(ip)) return { ok: false, reason: "banned" }

  for (const tier of ORDER_LIMITS) {
    const key = `orders:${ip}:${tier.name}`
    const count = await bump(key, tier.windowSeconds)
    if (count > tier.max) {
      if (tier.name === "burst") {
        // Track repeated burst trips in a separate bucket. If we hit
        // the auto-ban threshold, the IP earns a real ban.
        const tripsKey = `orders:${ip}:burst-trips`
        const trips = await bump(tripsKey, AUTO_BAN_BURST_WINDOW_SECONDS)
        if (trips >= AUTO_BAN_AFTER_BURST_TRIPS) {
          await banIp(ip, "auto:order-burst", AUTO_BAN_SECONDS)
          return { ok: false, reason: "banned" }
        }
      }
      return {
        ok: false,
        reason: tier.name as "burst" | "hour" | "day",
        retryAfterSeconds: tier.windowSeconds,
      }
    }
  }
  return { ok: true }
}

/**
 * Honeypot + dwell-time check.
 *
 *  - `_hp` is an invisible form field. Real users can't see it and
 *    won't fill it; bots that auto-fill every input will. A non-empty
 *    value is, with very high confidence, an attack.
 *  - `_t` is a timestamp the page set when the form rendered. Submitting
 *    the entire checkout in under 2 seconds means it was scripted, not typed.
 *  - We also reject obviously broken values (negative skew, far future).
 */
export interface AntiBotPayload {
  honeypot?: unknown
  formStartedAt?: unknown
}

export function checkAntiBot(p: AntiBotPayload): RateLimitDecision {
  if (typeof p.honeypot === "string" && p.honeypot.length > 0)
    return { ok: false, reason: "honeypot" }
  if (typeof p.formStartedAt === "number") {
    const elapsed = Date.now() - p.formStartedAt
    // Negative or wildly future timestamps → tampered client clock.
    if (elapsed < 0 || elapsed > 1000 * 60 * 60 * 8)
      return { ok: false, reason: "bad_client" }
    // Nobody fills the entire checkout legitimately in under 2s.
    if (elapsed < 2000) return { ok: false, reason: "too_fast" }
  }
  return { ok: true }
}

/**
 * Best-effort prune of expired counter rows. Cheap to call from a route
 * handler now and then; the index on reset_at keeps it fast.
 */
export async function pruneRateLimits(): Promise<void> {
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()))
}

/**
 * Used by admin views to surface recent hits / bans. Not called from
 * the hot path — exporting the helper keeps schema imports localized.
 */
export async function recentBans(limit = 50) {
  return db
    .select()
    .from(bannedIps)
    .where(
      and(
        // Show active bans first — anything with no expiry or future expiry.
        sql`(${bannedIps.expiresAt} IS NULL OR ${bannedIps.expiresAt} > NOW())`,
        gt(bannedIps.lastSeenAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      ),
    )
    .orderBy(sql`${bannedIps.lastSeenAt} DESC`)
    .limit(limit)
}
