"use server"

import { revalidatePath } from "next/cache"
import { eq, ne, and } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { z } from "zod"
import { db } from "@/lib/db"
import { categories, productCategories } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Convert an arbitrary string to a URL-safe slug. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

const categorySchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
    slug: z.string().trim().toLowerCase().max(80).optional(),
    description: z.string().trim().max(500).optional(),
    imageUrl: z.string().trim().max(500).url("URL inválida").optional().or(z.literal("")),
    position: z.coerce.number().int().min(0).max(9999),
    visible: z.boolean(),
    parentId: z.string().trim().max(64).optional().or(z.literal("")),
    seoTitle: z.string().trim().max(120).optional(),
    seoDescription: z.string().trim().max(300).optional(),
  })
  .strict()

function readForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
    position: Number(formData.get("position") ?? 0),
    visible: formData.get("visible") === "on",
    parentId: String(formData.get("parentId") ?? "").trim() || undefined,
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || undefined,
    seoDescription:
      String(formData.get("seoDescription") ?? "").trim() || undefined,
  }
}

/**
 * Create a category. Manager+ can do this — categories drive the
 * storefront's navigation, so it's catalog-level configuration, not
 * day-to-day operations.
 */
export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "No tienes permisos para crear categorías."
          : "No autenticado.",
    }
  }

  const parsed = categorySchema.safeParse(readForm(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Datos inválidos." }
  }
  const input = parsed.data

  const slug = input.slug && input.slug.length > 0 ? input.slug : slugify(input.name)
  if (!slug) return { ok: false, error: "Slug inválido." }

  // Reject collisions early — Postgres would also reject via the unique
  // index, but a friendly error beats a raw constraint message.
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  if (existing.length > 0) {
    return { ok: false, error: `Ya existe una categoría con el slug "${slug}".` }
  }

  try {
    await db.insert(categories).values({
      id: `cat_${createId()}`,
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      parentId: input.parentId && input.parentId.length > 0 ? input.parentId : null,
      position: input.position,
      visible: input.visible,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[categories] create failed:", msg)
    return { ok: false, error: "No se pudo crear la categoría." }
  }

  revalidatePath("/admin/categories")
  revalidatePath("/")
  return { ok: true }
}

export async function updateCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "No tienes permisos para editar categorías."
          : "No autenticado.",
    }
  }

  const id = String(formData.get("id") ?? "")
  if (!id) return { ok: false, error: "ID inválido." }

  const parsed = categorySchema.safeParse(readForm(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Datos inválidos." }
  }
  const input = parsed.data
  const slug = input.slug && input.slug.length > 0 ? input.slug : slugify(input.name)
  if (!slug) return { ok: false, error: "Slug inválido." }

  // Reject self-parenting (would create a cycle and break the tree).
  if (input.parentId === id) {
    return { ok: false, error: "Una categoría no puede ser su propio padre." }
  }

  // Reject slug collisions against OTHER rows.
  const collision = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), ne(categories.id, id)))
    .limit(1)
  if (collision.length > 0) {
    return { ok: false, error: `Ya existe otra categoría con el slug "${slug}".` }
  }

  try {
    await db
      .update(categories)
      .set({
        name: input.name,
        slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        parentId: input.parentId && input.parentId.length > 0 ? input.parentId : null,
        position: input.position,
        visible: input.visible,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[categories] update failed:", msg)
    return { ok: false, error: "No se pudo actualizar la categoría." }
  }

  revalidatePath("/admin/categories")
  revalidatePath("/")
  return { ok: true }
}

/**
 * Hard delete. The schema cascades to product_categories (the M:N table)
 * and sets parent_id to NULL on children, so children become root-level
 * instead of being orphaned. Products themselves are untouched.
 */
export async function deleteCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "No tienes permisos para eliminar categorías."
          : "No autenticado.",
    }
  }

  const id = String(formData.get("id") ?? "")
  if (!id) return { ok: false, error: "ID inválido." }

  try {
    await db.delete(productCategories).where(eq(productCategories.categoryId, id))
    await db.delete(categories).where(eq(categories.id, id))
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[categories] delete failed:", msg)
    return { ok: false, error: "No se pudo eliminar la categoría." }
  }

  revalidatePath("/admin/categories")
  revalidatePath("/")
  return { ok: true }
}
