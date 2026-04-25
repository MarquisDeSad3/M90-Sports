import "server-only"
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  productImages,
  products,
  variants,
} from "@/lib/db/schema"
import type {
  League,
  MockProduct,
  ProductStatus,
  Size,
  VersionType,
} from "@/lib/mock-data"

export interface ProductFilters {
  status?: ProductStatus | "all"
  league?: League | "all"
  search?: string
  limit?: number
  offset?: number
}

/**
 * Get products with variants + primary image. Returns the same shape
 * as MockProduct so existing UI keeps working unchanged.
 */
export async function getProducts(
  filters: ProductFilters = {}
): Promise<MockProduct[]> {
  const conditions = [isNull(products.deletedAt)]

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(products.status, filters.status))
  }
  if (filters.league && filters.league !== "all") {
    conditions.push(eq(products.league, filters.league))
  }
  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        ilike(products.name, q),
        ilike(products.team, q),
        ilike(products.playerName, q),
        ilike(products.season, q),
        ilike(products.slug, q)
      )!
    )
  }

  const where = and(...conditions)

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      brand: products.brand,
      team: products.team,
      player: products.playerName,
      number: products.playerNumber,
      season: products.season,
      league: products.league,
      versionType: products.versionType,
      status: products.status,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      costPerItem: products.costPerItem,
      featured: products.featured,
      isPreorder: products.isPreorder,
      preorderReleaseDate: products.preorderReleaseDate,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(where)
    .orderBy(desc(products.featured), asc(products.sortOrder), desc(products.updatedAt))
    .limit(filters.limit ?? 200)
    .offset(filters.offset ?? 0)

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)

  // Load variants in one query
  const allVariants = await db
    .select({
      id: variants.id,
      productId: variants.productId,
      size: variants.size,
      stock: variants.stock,
      sku: variants.sku,
      price: variants.price,
    })
    .from(variants)
    .where(or(...ids.map((id) => eq(variants.productId, id)))!)

  const variantsByProduct = new Map<string, typeof allVariants>()
  for (const v of allVariants) {
    const list = variantsByProduct.get(v.productId) ?? []
    list.push(v)
    variantsByProduct.set(v.productId, list)
  }

  // Primary images per product
  const primaryImages = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(
      and(
        or(...ids.map((id) => eq(productImages.productId, id)))!,
        eq(productImages.isPrimary, true)
      )
    )

  const imageByProduct = new Map<string, string>()
  for (const img of primaryImages) {
    imageByProduct.set(img.productId, img.url)
  }

  return rows.map((r): MockProduct => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    team: r.team ?? "",
    player: r.player ?? undefined,
    number: r.number ?? undefined,
    season: r.season ?? undefined,
    league: (r.league as League) ?? "OTRO",
    versionType: (r.versionType as VersionType) ?? "home",
    status: r.status as ProductStatus,
    basePrice: Number(r.basePrice),
    compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : undefined,
    costPerItem: r.costPerItem ? Number(r.costPerItem) : undefined,
    description: r.description ?? "",
    primaryImage: imageByProduct.get(r.id) ?? "",
    imageCount: 0,
    variants:
      variantsByProduct.get(r.id)?.map((v) => ({
        id: v.id,
        size: v.size as Size,
        stock: v.stock,
        sku: v.sku,
        price: v.price ? Number(v.price) : undefined,
      })) ?? [],
    categories: [],
    tags: [],
    featured: r.featured,
    isPreorder: r.isPreorder,
    preorderReleaseDate: r.preorderReleaseDate ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    unitsSold30d: 0,
    revenueThisMonth: 0,
  }))
}

export async function getProduct(idOrSlug: string): Promise<MockProduct | null> {
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug))!
      )
    )
    .limit(1)

  const product = rows[0]
  if (!product) return null

  const productVariants = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, product.id))

  const productPrimary = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(
      and(eq(productImages.productId, product.id), eq(productImages.isPrimary, true))
    )
    .limit(1)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    team: product.team ?? "",
    player: product.playerName ?? undefined,
    number: product.playerNumber ?? undefined,
    season: product.season ?? undefined,
    league: (product.league as League) ?? "OTRO",
    versionType: (product.versionType as VersionType) ?? "home",
    status: product.status as ProductStatus,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    costPerItem: product.costPerItem ? Number(product.costPerItem) : undefined,
    description: product.description ?? "",
    primaryImage: productPrimary[0]?.url ?? "",
    imageCount: 0,
    variants: productVariants.map((v) => ({
      id: v.id,
      size: v.size as Size,
      stock: v.stock,
      sku: v.sku,
      price: v.price ? Number(v.price) : undefined,
    })),
    categories: [],
    tags: [],
    featured: product.featured,
    isPreorder: product.isPreorder,
    preorderReleaseDate: product.preorderReleaseDate ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    unitsSold30d: 0,
    revenueThisMonth: 0,
  }
}

export interface ProductCounts {
  total: number
  published: number
  draft: number
  archived: number
  outOfStock: number
}

export async function getProductCounts(): Promise<ProductCounts> {
  const result = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${products.status} = 'published')::int`,
      draft: sql<number>`count(*) filter (where ${products.status} = 'draft')::int`,
      archived: sql<number>`count(*) filter (where ${products.status} = 'archived')::int`,
    })
    .from(products)
    .where(isNull(products.deletedAt))

  // Out of stock: products whose total variant stock = 0
  const outOfStockResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM ${products} p
    WHERE p.deleted_at IS NULL
      AND COALESCE((
        SELECT SUM(v.stock)
        FROM ${variants} v
        WHERE v.product_id = p.id
      ), 0) = 0
  `)
  const oosRow = outOfStockResult[0] as { count?: number } | undefined

  return {
    total: result[0]?.total ?? 0,
    published: result[0]?.published ?? 0,
    draft: result[0]?.draft ?? 0,
    archived: result[0]?.archived ?? 0,
    outOfStock: oosRow?.count ?? 0,
  }
}
