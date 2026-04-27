import "server-only"
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm"
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

export interface PreorderPage {
  products: PublicPreorderProduct[]
  total: number
}

interface PageParams {
  page: number
  pageSize: number
  categoryId?: string | null
  search?: string
}

/**
 * Server-paginated preorder catalog. Returns only the requested page
 * (default 30 rows) plus the filtered total so the client can render
 * pagination without ever loading the full ~9000 product list.
 *
 * Use `categoryId="uncategorized"` to scope to products that aren't
 * tagged into any "encargo-*" subcategory. Search runs ILIKE against
 * name + team — cheap on this volume.
 */
export async function getPublicPreorderPage({
  page,
  pageSize,
  categoryId,
  search,
}: PageParams): Promise<PreorderPage> {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, Math.min(60, pageSize))
  const offset = (safePage - 1) * safeSize

  const conditions = [
    isNull(products.deletedAt),
    eq(products.isPreorder, true),
    ne(products.status, "archived"),
  ]

  if (categoryId === "uncategorized") {
    conditions.push(sql`NOT EXISTS (
      SELECT 1 FROM ${productCategories} pc
      INNER JOIN ${categories} c ON c.id = pc.category_id
      WHERE pc.product_id = ${products.id} AND c.slug LIKE 'encargo-%'
    )`)
  } else if (categoryId) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${productCategories} pc
      WHERE pc.product_id = ${products.id} AND pc.category_id = ${categoryId}
    )`)
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`
    conditions.push(or(ilike(products.name, q), ilike(products.team, q))!)
  }

  const where = and(...conditions)

  try {
    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          team: products.team,
          basePrice: products.basePrice,
          featured: products.featured,
        })
        .from(products)
        .where(where)
        .orderBy(desc(products.featured), asc(products.name))
        .limit(safeSize)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(products)
        .where(where),
    ])

    if (rows.length === 0) {
      return { products: [], total: totalRow[0]?.count ?? 0 }
    }

    const ids = rows.map((r) => r.id)

    const [imgs, cats] = await Promise.all([
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
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

    return {
      products: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        team: r.team,
        basePrice: Number(r.basePrice),
        featured: r.featured,
        primaryImageUrl: imgMap.get(r.id) ?? null,
        categoryIds: catMap.get(r.id) ?? [],
      })),
      total: totalRow[0]?.count ?? 0,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-preorders] page query failed in dev:", err)
      return { products: [], total: 0 }
    }
    throw err
  }
}

/**
 * Legacy full-list query — kept for backwards-compat. Most callers
 * should switch to {@link getPublicPreorderPage}.
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
