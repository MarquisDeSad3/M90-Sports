"use server"

import { revalidatePath } from "next/cache"
import { and, eq, inArray, like } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { categories, productCategories } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult =
  | { ok: true; count: number }
  | { ok: false; error: string }

const bulkSchema = z
  .object({
    productIds: z.array(z.string().min(1)).min(1).max(500),
    categoryId: z.string().min(1),
    mode: z.enum(["add", "move"]).default("add"),
  })
  .strict()

/**
 * Assign a batch of products to a preorder category.
 *
 * - `add` (default): inserts the (productId, categoryId) row, ignoring
 *   duplicates. The product keeps any other categories it already had.
 * - `move`: removes the product from every other "encargo-" category
 *   first, then inserts the new one. Used when Ever wants to fix a
 *   miscategorization rather than tag in additional buckets.
 */
export async function bulkAssignCategoryAction(
  productIds: string[],
  categoryId: string,
  mode: "add" | "move" = "add",
): Promise<ActionResult> {
  try {
    await requireAdminRole("manager")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Sin permisos."
          : "No autenticado.",
    }
  }

  const parsed = bulkSchema.safeParse({ productIds, categoryId, mode })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }

  // Sanity-check that the target category exists.
  const target = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, parsed.data.categoryId))
    .limit(1)
  if (target.length === 0) {
    return { ok: false, error: "La colección no existe." }
  }

  try {
    if (parsed.data.mode === "move") {
      // Clear every other "encargo-*" category from these products
      // first, so the move is exclusive. The regular catalog categories
      // (everything that does NOT start with encargo-) stay intact.
      const encargoCats = await db
        .select({ id: categories.id })
        .from(categories)
        .where(like(categories.slug, "encargo-%"))

      if (encargoCats.length > 0) {
        await db
          .delete(productCategories)
          .where(
            and(
              inArray(productCategories.productId, parsed.data.productIds),
              inArray(
                productCategories.categoryId,
                encargoCats.map((c) => c.id),
              ),
            ),
          )
      }
    }

    await db
      .insert(productCategories)
      .values(
        parsed.data.productIds.map((pid) => ({
          productId: pid,
          categoryId: parsed.data.categoryId,
        })),
      )
      .onConflictDoNothing()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[preorders] bulk assign failed:", msg)
    return { ok: false, error: "No se pudo asignar la colección." }
  }

  revalidatePath("/admin/preorders")
  return { ok: true, count: parsed.data.productIds.length }
}
