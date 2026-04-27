import "server-only"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, reviews } from "@/lib/db/schema"
import type { MockReview, ReviewStatus } from "@/lib/mock-reviews"

export interface ReviewFilters {
  status?: ReviewStatus | "all"
  search?: string
  limit?: number
  offset?: number
}

export async function getReviews(
  filters: ReviewFilters = {}
): Promise<MockReview[]> {
  const conditions = []
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(reviews.status, filters.status))
  }
  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        ilike(reviews.customerName, q),
        ilike(reviews.body, q),
        ilike(reviews.title, q)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  try {
    const rows = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        customerName: reviews.customerName,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        photoUrl: reviews.photoUrl,
        status: reviews.status,
        createdAt: reviews.createdAt,
        adminResponse: reviews.adminResponse,
        adminResponseAt: reviews.adminResponseAt,
        productName: products.name,
        productTeam: products.team,
      })
      .from(reviews)
      .leftJoin(products, eq(products.id, reviews.productId))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(filters.limit ?? 200)
      .offset(filters.offset ?? 0)

    return rows.map((r): MockReview => ({
      id: r.id,
      productId: r.productId ?? "",
      productName: r.productName ?? "Reseña general",
      team: r.productTeam ?? "",
      customerName: r.customerName,
      customerCity: undefined,
      customerCountry: "CU",
      rating: Number(r.rating),
      body: r.body,
      hasPhoto: !!r.photoUrl,
      photoUrl: r.photoUrl ?? undefined,
      status: r.status as ReviewStatus,
      featured: false,
      createdAt: r.createdAt.toISOString(),
      adminResponse: r.adminResponse ?? undefined,
      adminResponseAt: r.adminResponseAt?.toISOString(),
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reviews] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export interface ReviewCounts {
  pending: number
  approved: number
  rejected: number
  featured: number
  total: number
}

export async function getReviewCounts(): Promise<ReviewCounts> {
  const result = await db
    .select({
      pending: sql<number>`count(*) filter (where ${reviews.status} = 'pending')::int`,
      approved: sql<number>`count(*) filter (where ${reviews.status} = 'approved')::int`,
      rejected: sql<number>`count(*) filter (where ${reviews.status} = 'rejected')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(reviews)

  return {
    pending: result[0]?.pending ?? 0,
    approved: result[0]?.approved ?? 0,
    rejected: result[0]?.rejected ?? 0,
    featured: 0,
    total: result[0]?.total ?? 0,
  }
}

export async function getApprovedReviews(): Promise<MockReview[]> {
  return getReviews({ status: "approved", limit: 100 })
}
