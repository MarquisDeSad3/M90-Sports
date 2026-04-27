import "server-only"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"

export type CouponApplied =
  | {
      ok: true
      couponId: string
      code: string
      discount: number
      shippingDiscount: number
      type: "percentage" | "fixed_amount" | "free_shipping"
    }
  | { ok: false; error: string }

interface ApplyOpts {
  rawCode: string
  subtotal: number
  shippingCost: number
}

/**
 * Validate and apply a coupon code at checkout. Returns the discount
 * amounts that should be subtracted from subtotal / shipping. Does NOT
 * mutate `used_count` — the caller increments it inside the order
 * transaction so we don't bump it for a request that ultimately fails
 * downstream (e.g. variant lookup error).
 *
 * Errors are user-friendly Spanish strings; the caller surfaces them
 * back to the checkout UI as 400s.
 */
export async function applyCoupon({
  rawCode,
  subtotal,
  shippingCost,
}: ApplyOpts): Promise<CouponApplied> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { ok: false, error: "Código vacío." }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { ok: false, error: "Código inválido." }
  }

  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1)
  const c = rows[0]
  if (!c) return { ok: false, error: "Cupón no existe." }
  if (!c.active) return { ok: false, error: "Cupón inactivo." }
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Cupón vencido." }
  }
  if (c.startsAt.getTime() > Date.now()) {
    return { ok: false, error: "Cupón aún no está disponible." }
  }
  if (c.maxUses !== null && c.usedCount >= c.maxUses) {
    return { ok: false, error: "Cupón agotado." }
  }

  const minPurchase = c.minPurchase ? Number(c.minPurchase) : null
  if (minPurchase !== null && subtotal < minPurchase) {
    return {
      ok: false,
      error: `Compra mínima $${minPurchase.toFixed(2)} para este cupón.`,
    }
  }

  const value = Number(c.value)
  let discount = 0
  let shippingDiscount = 0

  if (c.type === "percentage") {
    discount = Math.min(subtotal, (subtotal * value) / 100)
  } else if (c.type === "fixed_amount") {
    discount = Math.min(subtotal, value)
  } else if (c.type === "free_shipping") {
    shippingDiscount = shippingCost
  }

  // Round to 2 decimals to keep money math sane.
  discount = Math.round(discount * 100) / 100
  shippingDiscount = Math.round(shippingDiscount * 100) / 100

  return {
    ok: true,
    couponId: c.id,
    code: c.code,
    discount,
    shippingDiscount,
    type: c.type as "percentage" | "fixed_amount" | "free_shipping",
  }
}
