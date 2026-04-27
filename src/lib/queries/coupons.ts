import "server-only"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"

export type CouponType = "percentage" | "fixed_amount" | "free_shipping"
export type CouponAppliesTo = "all" | "category" | "product"

export interface CouponRecord {
  id: string
  code: string
  type: CouponType
  value: number
  minPurchase: number | null
  maxUses: number | null
  maxUsesPerCustomer: number
  usedCount: number
  appliesTo: CouponAppliesTo
  appliesToId: string | null
  startsAt: Date
  expiresAt: Date | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export async function getCoupons(): Promise<CouponRecord[]> {
  try {
    const rows = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))
      .limit(200)

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type as CouponType,
      value: Number(r.value),
      minPurchase: r.minPurchase ? Number(r.minPurchase) : null,
      maxUses: r.maxUses,
      maxUsesPerCustomer: r.maxUsesPerCustomer,
      usedCount: r.usedCount,
      appliesTo: r.appliesTo as CouponAppliesTo,
      appliesToId: r.appliesToId,
      startsAt: r.startsAt,
      expiresAt: r.expiresAt,
      active: r.active,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coupons] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}
