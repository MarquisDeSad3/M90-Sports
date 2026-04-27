import "server-only"
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
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

export interface AdminPreorderRow {
  id: string
  slug: string
  name: string
  team: string | null
  number: string | null
  basePrice: number
  status: string
  primaryImage: string | null
  categoryIds: string[]
}

export interface AdminPreorderPage {
  products: AdminPreorderRow[]
  total: number
}

interface PageParams {
  page: number
  pageSize: number
  categoryId?: string | null
  search?: string
}

/**
 * Server-paginated preorder list for /admin/preorders. Mirrors the
 * public version but keeps archived rows (admin sometimes needs to
 * find them) and exposes category ids so the client can show them
 * tagged.
 */
export async function getAdminPreorderPage({
  page,
  pageSize,
  categoryId,
  search,
}: PageParams): Promise<AdminPreorderPage> {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, Math.min(60, pageSize))
  const offset = (safePage - 1) * safeSize

  const conditions = [
    isNull(products.deletedAt),
    eq(products.isPreorder, true),
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
    conditions.push(
      or(
        ilike(products.name, q),
        ilike(products.team, q),
        ilike(products.playerName, q),
        ilike(products.slug, q),
      )!,
    )
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
          number: products.playerNumber,
          basePrice: products.basePrice,
          status: products.status,
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
        number: r.number,
        basePrice: Number(r.basePrice),
        status: r.status,
        primaryImage: imgMap.get(r.id) ?? null,
        categoryIds: catMap.get(r.id) ?? [],
      })),
      total: totalRow[0]?.count ?? 0,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin-preorders] page query failed in dev:", err)
      return { products: [], total: 0 }
    }
    throw err
  }
}

export interface AdminPreorderChip {
  id: string
  name: string
  count: number
}

/**
 * Counts of preorder products per "encargo-*" subcategory plus the
 * "uncategorized" bucket. Single query so the chips render fast.
 */
export async function getAdminPreorderChipCounts(): Promise<{
  total: number
  chips: AdminPreorderChip[]
  uncategorized: number
}> {
  try {
    const totalRow = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(products)
      .where(
        and(isNull(products.deletedAt), eq(products.isPreorder, true)),
      )
    const total = totalRow[0]?.count ?? 0

    const subRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        position: categories.position,
        count: sql<number>`COUNT(${productCategories.productId})::int`,
      })
      .from(categories)
      .leftJoin(
        productCategories,
        eq(productCategories.categoryId, categories.id),
      )
      .leftJoin(
        products,
        and(
          eq(products.id, productCategories.productId),
          isNull(products.deletedAt),
          eq(products.isPreorder, true),
        ),
      )
      .where(ilike(categories.slug, "encargo-%"))
      .groupBy(categories.id, categories.name, categories.position)
      .orderBy(asc(categories.position))

    const uncategorizedRow = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${products} p
      WHERE p.deleted_at IS NULL
        AND p.is_preorder = true
        AND NOT EXISTS (
          SELECT 1 FROM ${productCategories} pc
          INNER JOIN ${categories} c ON c.id = pc.category_id
          WHERE pc.product_id = p.id AND c.slug LIKE 'encargo-%'
        )
    `)
    const uncategorized =
      (uncategorizedRow[0] as { count?: number })?.count ?? 0

    return {
      total,
      chips: subRows.map((r) => ({
        id: r.id,
        name: r.name,
        count: r.count,
      })),
      uncategorized,
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin-preorders] chip counts failed in dev:", err)
      return { total: 0, chips: [], uncategorized: 0 }
    }
    throw err
  }
}
