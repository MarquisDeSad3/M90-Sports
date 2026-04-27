import "server-only"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"

export interface PublicReview {
  id: string
  customerName: string
  rating: number
  title: string | null
  body: string
  photoUrl: string | null
  adminResponse: string | null
  adminResponseAt: Date | null
  createdAt: Date
}

export interface ProductRatingSummary {
  reviewCount: number
  averageRating: number // 0 if no reviews
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

/**
 * Approved reviews for a product. Newest first. Capped — a 1000-review
 * product would benefit from pagination, but we won't see that volume
 * for a while and infinite scroll is overkill.
 */
export async function getApprovedReviews(
  productId: string,
  limit = 20,
): Promise<PublicReview[]> {
  try {
    const rows = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.status, "approved"),
        ),
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limit)

    return rows.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      title: r.title,
      body: r.body,
      photoUrl: r.photoUrl,
      adminResponse: r.adminResponse,
      adminResponseAt: r.adminResponseAt,
      createdAt: r.createdAt,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-reviews] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

/**
 * Aggregate stats for a product — count, average and per-star bucket
 * counts so the UI can render the typical "5★ ████ 12" rating bars.
 */
export async function getProductRatingSummary(
  productId: string,
): Promise<ProductRatingSummary> {
  try {
    const rows = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.status, "approved"),
        ),
      )
      .groupBy(reviews.rating)

    const distribution: ProductRatingSummary["distribution"] = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    let total = 0
    let weighted = 0
    for (const r of rows) {
      const stars = Math.max(1, Math.min(5, r.rating)) as 1 | 2 | 3 | 4 | 5
      distribution[stars] = r.count
      total += r.count
      weighted += stars * r.count
    }
    const averageRating = total === 0 ? 0 : weighted / total

    return {
      reviewCount: total,
      averageRating: Math.round(averageRating * 10) / 10,
      distribution,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[product-rating] DB unavailable in dev:", err)
      return {
        reviewCount: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }
    throw err
  }
}
