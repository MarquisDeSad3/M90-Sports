import "server-only"
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  categories,
  productCategories,
  productImages,
  products,
  variants,
} from "@/lib/db/schema"
import type {
  League,
  ProductStatus,
  Size,
  VersionType,
} from "@/lib/mock-data"

export interface PublicVariant {
  id: string
  size: Size
  stock: number
  sku: string
  price: number
}

export interface PublicProduct {
  id: string
  slug: string
  name: string
  team: string | null
  player: string | null
  number: string | null
  season: string | null
  league: League | null
  versionType: VersionType | null
  description: string | null
  basePrice: number
  compareAtPrice: number | null
  primaryImageUrl: string | null
  featured: boolean
  isPreorder: boolean
  preorderReleaseDate: string | null
  variants: PublicVariant[]
  totalStock: number
  categoryIds: string[]
}

export interface PublicCategory {
  id: string
  slug: string
  name: string
  position: number
}

/** Visible categories ordered for the storefront tabs. */
export async function getPublicCategories(): Promise<PublicCategory[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        position: categories.position,
      })
      .from(categories)
      .where(eq(categories.visible, true))
      .orderBy(asc(categories.position), asc(categories.name))
    return rows
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-categories] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  let rows: (typeof products.$inferSelect)[]
  try {
    rows = await db
      .select()
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.status, "published" satisfies ProductStatus)
        )
      )
      .orderBy(
        desc(products.featured),
        asc(products.sortOrder),
        desc(products.updatedAt)
      )
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-products] DB unavailable in dev:", err)
      return []
    }
    throw err
  }

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)

  const [allVariants, allPrimaryImages, allProductCategories] = await Promise.all([
    db.select().from(variants).where(inArray(variants.productId, ids)),
    db
      .select()
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, ids),
          eq(productImages.isPrimary, true)
        )
      ),
    db
      .select({
        productId: productCategories.productId,
        categoryId: productCategories.categoryId,
      })
      .from(productCategories)
      .where(inArray(productCategories.productId, ids)),
  ])

  const variantsMap = new Map<string, typeof allVariants>()
  for (const v of allVariants) {
    const list = variantsMap.get(v.productId) ?? []
    list.push(v)
    variantsMap.set(v.productId, list)
  }
  const imagesMap = new Map<string, string>()
  for (const img of allPrimaryImages) {
    imagesMap.set(img.productId, img.url)
  }
  const categoryIdsMap = new Map<string, string[]>()
  for (const pc of allProductCategories) {
    const list = categoryIdsMap.get(pc.productId) ?? []
    list.push(pc.categoryId)
    categoryIdsMap.set(pc.productId, list)
  }

  return rows.map((r): PublicProduct => {
    const vs = variantsMap.get(r.id) ?? []
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      team: r.team,
      player: r.playerName,
      number: r.playerNumber,
      season: r.season,
      league: r.league as League | null,
      versionType: r.versionType as VersionType | null,
      description: r.description,
      basePrice: Number(r.basePrice),
      compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
      primaryImageUrl: imagesMap.get(r.id) ?? null,
      featured: r.featured,
      isPreorder: r.isPreorder,
      preorderReleaseDate: r.preorderReleaseDate ?? null,
      variants: vs.map((v) => ({
        id: v.id,
        size: v.size as Size,
        stock: v.stock,
        sku: v.sku,
        price: Number(v.price ?? r.basePrice),
      })),
      totalStock: vs.reduce((s, v) => s + v.stock, 0),
      categoryIds: categoryIdsMap.get(r.id) ?? [],
    }
  })
}

export async function getPublicProduct(
  slug: string
): Promise<PublicProduct | null> {
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        eq(products.slug, slug),
        eq(products.status, "published" satisfies ProductStatus)
      )
    )
    .limit(1)

  const product = rows[0]
  if (!product) return null

  const [productVariants, primaryImg, productCats] = await Promise.all([
    db.select().from(variants).where(eq(variants.productId, product.id)),
    db
      .select({ url: productImages.url })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, product.id),
          eq(productImages.isPrimary, true)
        )
      )
      .limit(1),
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, product.id)),
  ])

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    team: product.team,
    player: product.playerName,
    number: product.playerNumber,
    season: product.season,
    league: product.league as League | null,
    versionType: product.versionType as VersionType | null,
    description: product.description,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    primaryImageUrl: primaryImg[0]?.url ?? null,
    featured: product.featured,
    isPreorder: product.isPreorder,
    preorderReleaseDate: product.preorderReleaseDate ?? null,
    variants: productVariants.map((v) => ({
      id: v.id,
      size: v.size as Size,
      stock: v.stock,
      sku: v.sku,
      price: Number(v.price ?? product.basePrice),
    })),
    totalStock: productVariants.reduce((s, v) => s + v.stock, 0),
    categoryIds: productCats.map((c) => c.categoryId),
  }
}
