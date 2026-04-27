import "server-only"
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { addresses, customers, orders } from "@/lib/db/schema"

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

export interface CustomerDetail extends CustomerRecord {
  addresses: CustomerAddress[]
  orders: CustomerOrderSummary[]
  notesInternal: string | null
}

export interface CustomerAddress {
  id: string
  recipientName: string
  phone: string
  street: string
  number: string | null
  betweenStreets: string | null
  neighborhood: string | null
  municipality: string
  province: string
  reference: string | null
  isDefault: boolean
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  currency: string
  placedAt: Date
  paidAt: Date | null
  shippedAt: Date | null
  deliveredAt: Date | null
}

export async function getCustomerDetail(
  id: string,
): Promise<CustomerDetail | null> {
  try {
    const customerRows = await db
      .select()
      .from(customers)
      .where(and(isNull(customers.deletedAt), eq(customers.id, id)))
      .limit(1)
    const customer = customerRows[0]
    if (!customer) return null

    const [addressRows, orderRows, lastOrderResult] = await Promise.all([
      db
        .select()
        .from(addresses)
        .where(eq(addresses.customerId, id))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt)),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          fulfillmentStatus: orders.fulfillmentStatus,
          total: orders.total,
          currency: orders.currency,
          placedAt: orders.placedAt,
          paidAt: orders.paidAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
        })
        .from(orders)
        .where(and(isNull(orders.deletedAt), eq(orders.customerId, id)))
        .orderBy(desc(orders.placedAt))
        .limit(50),
      db
        .select({ lastOrderAt: sql<Date | null>`MAX(${orders.placedAt})` })
        .from(orders)
        .where(and(isNull(orders.deletedAt), eq(orders.customerId, id))),
    ])

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      country: customer.country,
      isDiaspora: customer.isDiaspora,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      hasAccount: customer.hasAccount,
      marketingConsent: customer.marketingConsent,
      notes: customer.notes,
      notesInternal: customer.notes,
      createdAt: customer.createdAt,
      lastOrderAt: lastOrderResult[0]?.lastOrderAt
        ? new Date(lastOrderResult[0].lastOrderAt as Date)
        : null,
      addresses: addressRows.map((a) => ({
        id: a.id,
        recipientName: a.recipientName,
        phone: a.phone,
        street: a.street,
        number: a.number ?? null,
        betweenStreets: a.betweenStreets ?? null,
        neighborhood: a.neighborhood ?? null,
        municipality: a.municipality,
        province: String(a.province).replace(/_/g, " "),
        reference: a.reference ?? null,
        isDefault: a.isDefault,
      })),
      orders: orderRows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        total: Number(o.total),
        currency: o.currency,
        placedAt: o.placedAt,
        paidAt: o.paidAt,
        shippedAt: o.shippedAt,
        deliveredAt: o.deliveredAt,
      })),
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[customer-detail] DB unavailable in dev:", err)
      return null
    }
    throw err
  }
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
