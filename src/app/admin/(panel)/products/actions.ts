"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, like } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import {
  categories,
  productCategories,
  productImages,
  products,
  variants,
} from "@/lib/db/schema"
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

export interface ProductImageInput {
  url: string
  alt: string
  isPrimary: boolean
  position: number
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
  /** Ordered list of images. First with isPrimary=true wins; we coerce
   *  exactly one primary on save. */
  images?: ProductImageInput[]
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

      if (input.images && input.images.length > 0) {
        // Coerce exactly one primary — first one if the form forgot to flag any.
        let primarySeen = false
        await tx.insert(productImages).values(
          input.images.map((img, idx) => {
            const isPrimary =
              img.isPrimary && !primarySeen ? (primarySeen = true) : false
            return {
              productId,
              url: img.url,
              alt: img.alt || null,
              isPrimary: isPrimary || (idx === 0 && !input.images!.some((x) => x.isPrimary)),
              position: img.position ?? idx,
            }
          }),
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

      // Replace images. Same wholesale strategy as variants — small lists,
      // simpler than diffing.
      await tx.delete(productImages).where(eq(productImages.productId, id))
      if (input.images && input.images.length > 0) {
        let primarySeen = false
        await tx.insert(productImages).values(
          input.images.map((img, idx) => {
            const isPrimary =
              img.isPrimary && !primarySeen ? (primarySeen = true) : false
            return {
              productId: id,
              url: img.url,
              alt: img.alt || null,
              isPrimary: isPrimary || (idx === 0 && !input.images!.some((x) => x.isPrimary)),
              position: img.position ?? idx,
            }
          }),
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

// ---------------------------------------------------------------------------
// Bulk operations for the /admin/products list. These take an array of IDs so
// the UI can offer "select N products → do X" in a single round-trip instead
// of N requests. All require manager+; cost-bearing data isn't touched here.
// ---------------------------------------------------------------------------

import { inArray } from "drizzle-orm"

export type BulkResult = { ok: true; affected: number } | { ok: false; error: string }

/**
 * Validate a freshly-received list of product IDs. Returns null if OK or an
 * error message we can surface to the client.
 */
function validateIds(ids: string[]): string | null {
  if (!Array.isArray(ids) || ids.length === 0) return "Lista vacía."
  if (ids.length > 200) return "Demasiados productos en una operación."
  if (ids.some((id) => typeof id !== "string" || !id.startsWith("prod_"))) {
    return "IDs inválidos."
  }
  return null
}

/** Soft-delete N products in one shot. */
export async function bulkDeleteProductsAction(
  ids: string[],
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(ids)
  if (err) return { ok: false, error: err }
  try {
    const result = await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inArray(products.id, ids))
      .returning({ id: products.id })
    revalidatePath("/admin/products")
    revalidatePath("/admin")
    revalidatePath("/")
    return { ok: true, affected: result.length }
  } catch {
    return { ok: false, error: "No se pudo eliminar." }
  }
}

/** Switch N products to the same status (e.g. publish all selected drafts). */
export async function bulkSetStatusAction(
  ids: string[],
  status: ProductStatus,
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(ids)
  if (err) return { ok: false, error: err }
  if (!["draft", "published", "archived"].includes(status)) {
    return { ok: false, error: "Estado inválido." }
  }
  try {
    const result = await db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(inArray(products.id, ids))
      .returning({ id: products.id })
    revalidatePath("/admin/products")
    revalidatePath("/admin")
    revalidatePath("/")
    return { ok: true, affected: result.length }
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." }
  }
}

/** Toggle "featured" for N products. */
export async function bulkSetFeaturedAction(
  ids: string[],
  featured: boolean,
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(ids)
  if (err) return { ok: false, error: err }
  try {
    const result = await db
      .update(products)
      .set({ featured, updatedAt: new Date() })
      .where(inArray(products.id, ids))
      .returning({ id: products.id })
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { ok: true, affected: result.length }
  } catch {
    return { ok: false, error: "No se pudo actualizar." }
  }
}

/**
 * Add a category to N products. Skips pairs that already exist
 * (ON CONFLICT DO NOTHING-equivalent via a fresh delete-then-insert is
 * overkill; we just filter in JS for the small lists involved).
 */
export async function bulkAssignCategoryAction(
  productIds: string[],
  categoryId: string,
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(productIds)
  if (err) return { ok: false, error: err }
  if (typeof categoryId !== "string" || !categoryId.startsWith("cat_")) {
    return { ok: false, error: "Categoría inválida." }
  }
  try {
    // Find which assignments already exist so we don't try to insert dupes
    // (the M:N table has a composite PK and would error on duplicates).
    const existing = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(
        and(
          inArray(productCategories.productId, productIds),
          eq(productCategories.categoryId, categoryId),
        ),
      )
    const have = new Set(existing.map((e) => e.productId))
    const missing = productIds.filter((id) => !have.has(id))
    if (missing.length > 0) {
      await db.insert(productCategories).values(
        missing.map((productId) => ({ productId, categoryId })),
      )
    }
    revalidatePath("/admin/products")
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { ok: true, affected: missing.length }
  } catch {
    return { ok: false, error: "No se pudo asignar la categoría." }
  }
}

/**
 * Promote N preorder products into a regular catalog category.
 *
 * Side-effects per product:
 *   1. `is_preorder` flips to false (no longer "por encargo").
 *   2. `status` flips to 'published' (so it shows up on the front page).
 *   3. The target category is added to product_categories.
 *   4. Every "encargo-*" subcategory is removed from the product, since
 *      it lives in the regular catalog now and shouldn't double-count
 *      under the preorder hierarchy.
 *
 * The variant stock is NOT touched — Ever can edit it on the product
 * page if the import set the default 999 placeholder.
 */
export async function promoteFromPreorderAction(
  productIds: string[],
  categoryId: string,
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(productIds)
  if (err) return { ok: false, error: err }
  if (typeof categoryId !== "string" || !categoryId.startsWith("cat_")) {
    return { ok: false, error: "Categoría inválida." }
  }
  try {
    // Lookup all encargo-* category ids in one shot so we can scrub them
    // off the products being promoted.
    const encargoCats = await db
      .select({ id: categories.id })
      .from(categories)
      .where(like(categories.slug, "encargo-%"))
    const encargoIds = encargoCats.map((c) => c.id)

    await db
      .update(products)
      .set({
        isPreorder: false,
        status: "published",
        updatedAt: new Date(),
      })
      .where(inArray(products.id, productIds))

    if (encargoIds.length > 0) {
      await db
        .delete(productCategories)
        .where(
          and(
            inArray(productCategories.productId, productIds),
            inArray(productCategories.categoryId, encargoIds),
          ),
        )
    }

    // Add the target category, skipping rows that are already there.
    const existing = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(
        and(
          inArray(productCategories.productId, productIds),
          eq(productCategories.categoryId, categoryId),
        ),
      )
    const have = new Set(existing.map((e) => e.productId))
    const missing = productIds.filter((id) => !have.has(id))
    if (missing.length > 0) {
      await db
        .insert(productCategories)
        .values(missing.map((productId) => ({ productId, categoryId })))
    }

    revalidatePath("/admin/products")
    revalidatePath("/admin/preorders")
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { ok: true, affected: productIds.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[products] promote-from-preorder failed:", msg)
    return { ok: false, error: "No se pudo promover los productos." }
  }
}

/** Remove a category from N products. */
export async function bulkUnassignCategoryAction(
  productIds: string[],
  categoryId: string,
): Promise<BulkResult> {
  await requireAdminRole("manager")
  const err = validateIds(productIds)
  if (err) return { ok: false, error: err }
  if (typeof categoryId !== "string" || !categoryId.startsWith("cat_")) {
    return { ok: false, error: "Categoría inválida." }
  }
  try {
    const result = await db
      .delete(productCategories)
      .where(
        and(
          inArray(productCategories.productId, productIds),
          eq(productCategories.categoryId, categoryId),
        ),
      )
      .returning({ productId: productCategories.productId })
    revalidatePath("/admin/products")
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { ok: true, affected: result.length }
  } catch {
    return { ok: false, error: "No se pudo quitar la categoría." }
  }
}
