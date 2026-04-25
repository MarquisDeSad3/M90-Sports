import "server-only"
import { and, desc, eq, gte, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  addresses,
  customers,
  orderItems,
  orders,
  reviews,
} from "@/lib/db/schema"

/**
 * Aggregations that power the admin dashboard. Single export so the
 * page makes one Promise.all instead of waterfalling.
 *
 * Tolerant of a missing DB in dev: returns zeros and empty arrays so
 * the page renders without crashing during local development.
 */

export interface DashboardData {
  salesToday: number
  salesYesterday: number
  ordersToday: number
  ordersYesterday: number
  paymentsToVerify: number
  reviewsPending: number
  topProducts: Array<{ name: string; sold: number; revenue: number }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string | null
    locationLabel: string
    total: number
    paymentMethod: string | null
    paymentStatus: string
    placedAt: Date
  }>
  salesByDay: Array<{ day: string; revenue: number; orders: number }>
}

const EMPTY: DashboardData = {
  salesToday: 0,
  salesYesterday: 0,
  ordersToday: 0,
  ordersYesterday: 0,
  paymentsToVerify: 0,
  reviewsPending: 0,
  topProducts: [],
  recentOrders: [],
  salesByDay: [],
}

function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // include today = 7 days

    const [
      todayAgg,
      yesterdayAgg,
      paymentsToVerify,
      reviewsPending,
      topProducts,
      recentOrders,
      salesByDayRows,
    ] = await Promise.all([
      // Sales today (subtract cancelled to keep the number honest).
      db
        .select({
          revenue: sql<string>`COALESCE(SUM(${orders.total})::text, '0')`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.placedAt, todayStart),
            sql`${orders.status} != 'cancelled'`,
          ),
        ),

      // Same window for yesterday — compares apples to apples.
      db
        .select({
          revenue: sql<string>`COALESCE(SUM(${orders.total})::text, '0')`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.placedAt, yesterdayStart),
            lt(orders.placedAt, todayStart),
            sql`${orders.status} != 'cancelled'`,
          ),
        ),

      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(orders)
        .where(eq(orders.paymentStatus, "proof_uploaded")),

      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reviews)
        .where(eq(reviews.status, "pending")),

      // Top 4 by quantity sold. orderItems already snapshots productName
      // at order time, so we group on that — no join needed and it stays
      // accurate even if a product is renamed or deleted later.
      db
        .select({
          name: orderItems.productName,
          sold: sql<number>`SUM(${orderItems.quantity})::int`,
          revenue: sql<string>`COALESCE(SUM(${orderItems.subtotal})::text, '0')`,
        })
        .from(orderItems)
        .groupBy(orderItems.productName)
        .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
        .limit(4),

      // Recent orders with customer + address. LEFT JOINs because either
      // can be deleted/null without losing the order.
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          placedAt: orders.placedAt,
          customerName: customers.name,
          customerCountry: customers.country,
          municipality: addresses.municipality,
          province: addresses.province,
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .leftJoin(addresses, eq(addresses.id, orders.shippingAddressId))
        .orderBy(desc(orders.placedAt))
        .limit(5),

      // Daily revenue for the last 7 days. We bucket by date_trunc('day')
      // so the result is one row per day even with mixed timestamps.
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
          revenue: sql<string>`COALESCE(SUM(${orders.total})::text, '0')`,
          orders: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.placedAt, sevenDaysAgo),
            sql`${orders.status} != 'cancelled'`,
          ),
        )
        .groupBy(sql`date_trunc('day', ${orders.placedAt})`)
        .orderBy(sql`date_trunc('day', ${orders.placedAt}) ASC`),
    ])

    return {
      salesToday: Number(todayAgg[0]?.revenue ?? 0),
      salesYesterday: Number(yesterdayAgg[0]?.revenue ?? 0),
      ordersToday: todayAgg[0]?.count ?? 0,
      ordersYesterday: yesterdayAgg[0]?.count ?? 0,
      paymentsToVerify: paymentsToVerify[0]?.count ?? 0,
      reviewsPending: reviewsPending[0]?.count ?? 0,
      topProducts: topProducts.map((r) => ({
        name: r.name ?? "(sin nombre)",
        sold: r.sold ?? 0,
        revenue: Number(r.revenue ?? 0),
      })),
      recentOrders: recentOrders.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        customerName: r.customerName,
        locationLabel: [r.municipality, r.province?.replace(/_/g, " ")]
          .filter(Boolean)
          .join(", ") || (r.customerCountry ?? ""),
        total: Number(r.total),
        paymentMethod: r.paymentMethod ?? null,
        paymentStatus: r.paymentStatus,
        placedAt: r.placedAt,
      })),
      salesByDay: salesByDayRows.map((r) => ({
        day: r.day,
        revenue: Number(r.revenue),
        orders: r.orders,
      })),
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[dashboard] DB unavailable in dev:", err)
      return EMPTY
    }
    throw err
  }
}
