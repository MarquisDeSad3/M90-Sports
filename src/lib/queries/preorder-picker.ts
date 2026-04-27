import "server-only"
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { productImages, products } from "@/lib/db/schema"

export interface PreorderPickerItem {
  id: string
  name: string
  team: string | null
  basePrice: number
  primaryImageUrl: string | null
  status: string
}

/**
 * Slim list of every preorder-pool product, used by the "Agregar desde
 * Por encargo" dialog on /admin/products. We strip everything that
 * isn't shown in the picker (variants, descriptions, timestamps) so the
 * payload stays small even with thousands of items.
 */
export async function getPreorderPicker(): Promise<PreorderPickerItem[]> {
  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        team: products.team,
        basePrice: products.basePrice,
        status: products.status,
      })
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.isPreorder, true),
        ),
      )
      .orderBy(desc(products.featured), asc(products.name))

    if (rows.length === 0) return []

    const ids = rows.map((r) => r.id)
    const imgs = await db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(
        and(
          inArray(productImages.productId, ids),
          eq(productImages.isPrimary, true),
        ),
      )
    const imgMap = new Map<string, string>()
    for (const img of imgs) imgMap.set(img.productId, img.url)

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      team: r.team,
      basePrice: Number(r.basePrice),
      primaryImageUrl: imgMap.get(r.id) ?? null,
      status: r.status,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[preorder-picker] DB unavailable in dev:", err)
      return []
    }
    throw err
  }
}
