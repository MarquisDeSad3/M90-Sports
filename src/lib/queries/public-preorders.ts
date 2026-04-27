import "server-only"
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  categories,
  productCategories,
  productImages,
  products,
} from "@/lib/db/schema"

export interface PublicPreorderProduct {
  id: string
  slug: string
  name: string
  team: string | null
  basePrice: number
  primaryImageUrl: string | null
  featured: boolean
  categoryIds: string[]
}

export interface PublicPreorderSubcategory {
  id: string
  slug: string
  name: string
  position: number
  count: number
}

/**
 * Slim list of every preorder product — used by /por-encargo. Includes
 * the subcategory ids each product is assigned to so the client can
 * filter by chip without another round-trip.
 *
 * Excludes archived products (Ever marks the obvious garbage as
 * archived from /admin/preorders).
 */
export async function getPublicPreorderProducts(): Promise<
  PublicPreorderProduct[]
> {
  try {
    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        team: products.team,
        basePrice: products.basePrice,
        featured: products.featured,
      })
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.isPreorder, true),
          ne(products.status, "archived"),
        ),
      )
      .orderBy(desc(products.featured), asc(products.name))

    if (rows.length === 0) return []

    const ids = rows.map((r) => r.id)

    const [imgs, cats] = await Promise.all([
      db
        .select({ productId: productImages.productId, url: productImages.url })
        .from(productImages)
        .where(
          and(
            inArray(productImages.productId, ids),
            eq(productImages.isPrimary, true),
          ),
        ),
      db
        .select({
          productId: productCategories.productId,
          categoryId: productCategories.categoryId,
        })
        .from(productCategories)
        .where(inArray(productCategories.productId, ids)),
    ])

    const imgMap = new Map<string, string>()
    for (const img of imgs) imgMap.set(img.productId, img.url)
    const catMap = new Map<string, string[]>()
    for (const c of cats) {
      const list = catMap.get(c.productId) ?? []
      list.push(c.categoryId)
      catMap.set(c.productId, list)
    }

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      team: r.team,
      basePrice: Number(r.basePrice),
      featured: r.featured,
      primaryImageUrl: imgMap.get(r.id) ?? null,
      categoryIds: catMap.get(r.id) ?? [],
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-preorders] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

/** Subcategories of "Por encargo" with product counts, for the chips. */
export async function getPublicPreorderSubcategories(): Promise<
  PublicPreorderSubcategory[]
> {
  try {
    const parent = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, "por-encargo"))
      .limit(1)
    if (parent.length === 0) return []

    const subs = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        position: categories.position,
      })
      .from(categories)
      .where(eq(categories.parentId, parent[0]!.id))
      .orderBy(asc(categories.position), asc(categories.name))

    if (subs.length === 0) return []

    const subIds = subs.map((s) => s.id)

    const counts = await db
      .select({
        categoryId: productCategories.categoryId,
        productId: productCategories.productId,
      })
      .from(productCategories)
      .innerJoin(products, eq(products.id, productCategories.productId))
      .where(
        and(
          inArray(productCategories.categoryId, subIds),
          isNull(products.deletedAt),
          eq(products.isPreorder, true),
          ne(products.status, "archived"),
        ),
      )

    const countMap = new Map<string, number>()
    for (const c of counts) {
      countMap.set(c.categoryId, (countMap.get(c.categoryId) ?? 0) + 1)
    }

    return subs.map((s) => ({
      ...s,
      count: countMap.get(s.id) ?? 0,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-preorders] subs unavailable in dev:", err)
      return []
    }
    throw err
  }
}
