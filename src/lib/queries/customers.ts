import "server-only"
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { customers, orders } from "@/lib/db/schema"

export type CustomerSegment = "all" | "diaspora" | "cuba" | "vip" | "lapsed"

export interface CustomerRecord {
  id: string
  name: string
  phone: string | null
  email: string | null
  country: string
  isDiaspora: boolean
  totalOrders: number
  totalSpent: number
  lastOrderAt: Date | null
  hasAccount: boolean
  marketingConsent: boolean
  notes: string | null
  createdAt: Date
}

export interface CustomerFilters {
  segment?: CustomerSegment
  search?: string
  limit?: number
}

const VIP_SPEND_THRESHOLD = 100 // USD lifetime spend
const LAPSED_DAYS = 90

/**
 * List customers with their order roll-up. Segments:
 *   - diaspora: country != 'CU' OR isDiaspora flag
 *   - cuba: country = 'CU' AND !isDiaspora
 *   - vip: lifetime spend >= $100
 *   - lapsed: had at least one order, last one > 90 days ago
 *   - all: no filter
 */
export async function getCustomers(
  filters: CustomerFilters = {},
): Promise<CustomerRecord[]> {
  const conditions = [isNull(customers.deletedAt)]

  if (filters.segment === "diaspora") {
    conditions.push(eq(customers.isDiaspora, true))
  } else if (filters.segment === "cuba") {
    conditions.push(eq(customers.isDiaspora, false))
    conditions.push(eq(customers.country, "CU"))
  } else if (filters.segment === "vip") {
    conditions.push(
      sql`${customers.totalSpent}::numeric >= ${VIP_SPEND_THRESHOLD}`,
    )
  }

  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        ilike(customers.name, q),
        ilike(customers.phone, q),
        ilike(customers.email, q),
      )!,
    )
  }

  const where = and(...conditions)

  try {
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        country: customers.country,
        isDiaspora: customers.isDiaspora,
        totalOrders: customers.totalOrders,
        totalSpent: customers.totalSpent,
        hasAccount: customers.hasAccount,
        marketingConsent: customers.marketingConsent,
        notes: customers.notes,
        createdAt: customers.createdAt,
        lastOrderAt: sql<Date | null>`(
          SELECT MAX(${orders.placedAt})
          FROM ${orders}
          WHERE ${orders.customerId} = ${customers.id}
            AND ${orders.deletedAt} IS NULL
        )`,
      })
      .from(customers)
      .where(where)
      .orderBy(desc(customers.totalSpent), desc(customers.createdAt))
      .limit(filters.limit ?? 200)

    let processed = rows.map((r): CustomerRecord => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      country: r.country,
      isDiaspora: r.isDiaspora,
      totalOrders: r.totalOrders,
      totalSpent: Number(r.totalSpent),
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt as Date) : null,
      hasAccount: r.hasAccount,
      marketingConsent: r.marketingConsent,
      notes: r.notes,
      createdAt: r.createdAt,
    }))

    if (filters.segment === "lapsed") {
      const cutoff = Date.now() - LAPSED_DAYS * 24 * 60 * 60 * 1000
      processed = processed.filter(
        (c) =>
          c.lastOrderAt !== null && c.lastOrderAt.getTime() < cutoff,
      )
    }

    return processed
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[customers] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export interface CustomerCounts {
  total: number
  diaspora: number
  cuba: number
  vip: number
  withAccount: number
}

export async function getCustomerCounts(): Promise<CustomerCounts> {
  try {
    const result = await db
      .select({
        total: sql<number>`count(*)::int`,
        diaspora: sql<number>`count(*) filter (where ${customers.isDiaspora} = true)::int`,
        cuba: sql<number>`count(*) filter (where ${customers.isDiaspora} = false and ${customers.country} = 'CU')::int`,
        vip: sql<number>`count(*) filter (where ${customers.totalSpent}::numeric >= ${VIP_SPEND_THRESHOLD})::int`,
        withAccount: sql<number>`count(*) filter (where ${customers.hasAccount} = true)::int`,
      })
      .from(customers)
      .where(isNull(customers.deletedAt))

    return {
      total: result[0]?.total ?? 0,
      diaspora: result[0]?.diaspora ?? 0,
      cuba: result[0]?.cuba ?? 0,
      vip: result[0]?.vip ?? 0,
      withAccount: result[0]?.withAccount ?? 0,
    }
  } catch {
    return { total: 0, diaspora: 0, cuba: 0, vip: 0, withAccount: 0 }
  }
}
