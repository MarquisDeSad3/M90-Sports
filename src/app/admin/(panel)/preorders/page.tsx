import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import { getProducts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { PreordersView } from "./preorders-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Preorders dashboard. Same data as /admin/products filtered to
 * isPreorder=true, but grouped by the dedicated preorder categories
 * (Selecciones, Clubes, NBA, etc.) so Ever can scan a section at a time.
 */
export default async function PreordersPage() {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const [products, allCategories] = await Promise.all([
    getProducts({ limit: 5000 }),
    getCategories(),
  ])

  // Only the dedicated preorder categories — they all use the
  // "encargo-" slug prefix.
  const preorderCategories = allCategories
    .filter((c) => c.slug.startsWith("encargo-"))
    .sort((a, b) => a.position - b.position)

  // Build a map productId → array of preorder category ids it belongs to.
  // Each product is shown under EVERY category it matches; uncategorized
  // products get their own "Sin clasificar" bucket at the end.
  const preorderProducts = products.filter(
    (p) => p.id.startsWith("prod_yp_") && p.status !== "archived",
  )

  const sections = preorderCategories.map((c) => ({
    id: c.id,
    name: c.name.replace(" (por encargo)", ""),
    products: preorderProducts.filter((p) => p.categories.includes(c.id)),
  }))

  const categorizedIds = new Set(
    preorderProducts.flatMap((p) =>
      preorderCategories.some((c) => p.categories.includes(c.id)) ? [p.id] : [],
    ),
  )
  const uncategorized = preorderProducts.filter((p) => !categorizedIds.has(p.id))
  if (uncategorized.length > 0) {
    sections.push({
      id: "uncategorized",
      name: "Sin clasificar",
      products: uncategorized,
    })
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Por encargo
        </h2>
        <p className="text-sm text-muted-foreground">
          {preorderProducts.length} productos por encargo organizados por sección.
        </p>
      </div>

      <PreordersView sections={sections} totalProducts={preorderProducts.length} />
    </div>
  )
}
