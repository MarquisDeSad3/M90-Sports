"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { productCategories, products, variants } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"
import type {
  League,
  ProductStatus,
  Size,
  VersionType,
} from "@/lib/mock-data"

export interface VariantInput {
  size: Size
  stock: number
  sku?: string
  price?: number
}

export interface ProductInput {
  name: string
  slug: string
  description?: string
  team?: string
  player?: string
  number?: string
  season?: string
  league: League
  versionType: VersionType
  status: ProductStatus
  basePrice: number
  compareAtPrice?: number
  costPerItem?: number
  featured: boolean
  isPreorder: boolean
  preorderReleaseDate?: string
  variants: VariantInput[]
  /** IDs of categories the product belongs to (M:N). Empty = uncategorized. */
  categoryIds?: string[]
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

function validateInput(input: ProductInput): string | null {
  if (!input.name || input.name.trim().length < 3) return "El nombre es muy corto."
  if (!input.slug) return "El slug es obligatorio."
  if (typeof input.basePrice !== "number" || input.basePrice <= 0)
    return "El precio debe ser mayor que 0."
  if (input.variants.some((v) => v.stock < 0))
    return "El stock no puede ser negativo."
  return null
}

export async function createProduct(
  input: ProductInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdminRole("manager")

  const validationError = validateInput(input)
  if (validationError) return { ok: false, error: validationError }

  const slug = input.slug || slugify(input.name)
  const productId = `prod_${createId()}`

  try {
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id: productId,
        slug,
        name: input.name.trim(),
        description: input.description ?? null,
        team: input.team?.trim() ?? null,
        playerName: input.player?.trim() ?? null,
        playerNumber: input.number?.trim() ?? null,
        season: input.season?.trim() ?? null,
        league: input.league,
        versionType: input.versionType,
        status: input.status,
        basePrice: String(input.basePrice),
        compareAtPrice: input.compareAtPrice ? String(input.compareAtPrice) : null,
        costPerItem: input.costPerItem ? String(input.costPerItem) : null,
        featured: input.featured,
        isPreorder: input.isPreorder,
        preorderReleaseDate: input.preorderReleaseDate ?? null,
      })

      if (input.variants.length > 0) {
        await tx.insert(variants).values(
          input.variants.map((v, idx) => ({
            id: `var_${createId()}`,
            productId,
            size: v.size,
            stock: v.stock,
            sku: v.sku || `${slug.toUpperCase().slice(0, 12)}-${v.size}`,
            price: v.price ? String(v.price) : null,
            position: idx,
          }))
        )
      }

      if (input.categoryIds && input.categoryIds.length > 0) {
        await tx.insert(productCategories).values(
          input.categoryIds.map((categoryId) => ({
            productId,
            categoryId,
          })),
        )
      }
    })
  } catch (err) {
    const msg = (err as Error).message ?? String(err)
    if (msg.includes("products_slug_idx") || msg.includes("duplicate")) {
      return { ok: false, error: "Ya existe un producto con ese slug." }
    }
    return { ok: false, error: "No se pudo crear el producto: " + msg }
  }

  revalidatePath("/admin/products")
  revalidatePath("/admin")
  return { ok: true, data: { id: productId } }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ id: string }>> {
  await requireAdminRole("manager")

  const validationError = validateInput(input)
  if (validationError) return { ok: false, error: validationError }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          slug: input.slug,
          name: input.name.trim(),
          description: input.description ?? null,
          team: input.team?.trim() ?? null,
          playerName: input.player?.trim() ?? null,
          playerNumber: input.number?.trim() ?? null,
          season: input.season?.trim() ?? null,
          league: input.league,
          versionType: input.versionType,
          status: input.status,
          basePrice: String(input.basePrice),
          compareAtPrice: input.compareAtPrice ? String(input.compareAtPrice) : null,
          costPerItem: input.costPerItem ? String(input.costPerItem) : null,
          featured: input.featured,
          isPreorder: input.isPreorder,
          preorderReleaseDate: input.preorderReleaseDate ?? null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))

      // Replace variants entirely (simple strategy for now)
      await tx.delete(variants).where(eq(variants.productId, id))

      if (input.variants.length > 0) {
        await tx.insert(variants).values(
          input.variants.map((v, idx) => ({
            id: `var_${createId()}`,
            productId: id,
            size: v.size,
            stock: v.stock,
            sku: v.sku || `${input.slug.toUpperCase().slice(0, 12)}-${v.size}`,
            price: v.price ? String(v.price) : null,
            position: idx,
          }))
        )
      }

      // Replace category assignments. Cheaper than diffing for the
      // small lists involved (typically 0-3 categories per product).
      await tx
        .delete(productCategories)
        .where(eq(productCategories.productId, id))

      if (input.categoryIds && input.categoryIds.length > 0) {
        await tx.insert(productCategories).values(
          input.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
        )
      }
    })
  } catch (err) {
    return {
      ok: false,
      error: "No se pudo actualizar: " + ((err as Error).message ?? String(err)),
    }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath("/admin")
  return { ok: true, data: { id } }
}

export async function deleteProduct(
  id: string
): Promise<ActionResult<{ id: string }>> {
  await requireAdminRole("manager")
  try {
    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id))
  } catch (err) {
    return {
      ok: false,
      error: "No se pudo eliminar: " + ((err as Error).message ?? String(err)),
    }
  }
  revalidatePath("/admin/products")
  revalidatePath("/admin")
  redirect("/admin/products")
}
