import "server-only"
import { asc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { categories, productCategories } from "@/lib/db/schema"

/**
 * Snapshot of a category for the admin list, with the count of
 * products assigned. We expose `productCount` here so the UI can
 * show "12 productos" next to each row without an extra round-trip.
 */
export interface AdminCategory {
  id: string
  parentId: string | null
  slug: string
  name: string
  description: string | null
  imageUrl: string | null
  position: number
  visible: boolean
  seoTitle: string | null
  seoDescription: string | null
  productCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Load every category. The list stays small (a handful of rows even
 * for large catalogs) so we don't paginate. Sorted by position then
 * name so reordering feels predictable.
 */
export async function getCategories(): Promise<AdminCategory[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        imageUrl: categories.imageUrl,
        position: categories.position,
        visible: categories.visible,
        seoTitle: categories.seoTitle,
        seoDescription: categories.seoDescription,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${productCategories}
          WHERE ${productCategories.categoryId} = ${categories.id}
        )`,
      })
      .from(categories)
      .orderBy(asc(categories.position), asc(categories.name))

    return rows
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[categories] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function getCategoryById(id: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)
  return rows[0] ?? null
}
