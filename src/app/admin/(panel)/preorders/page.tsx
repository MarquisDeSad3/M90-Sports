import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import { getProducts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { PreordersView } from "./preorders-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Preorders dashboard. Shows every isPreorder=true product in a single
 * grid, filtered by chip-style category tags at the top. Bulk
 * multi-select lets Ever assign batches to a preorder collection
 * (Selecciones, Clubes, NBA, ...) without opening each product.
 */
export default async function PreordersPage() {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const [products, allCategories] = await Promise.all([
    getProducts({ limit: 15000, isPreorder: true }),
    getCategories(),
  ])

  const preorderCategories = allCategories
    .filter((c) => c.slug.startsWith("encargo-"))
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      id: c.id,
      name: c.name,
    }))

  // Counts per category (a product can live in multiple).
  const counts: Record<string, number> = {}
  let uncategorized = 0
  for (const p of products) {
    const inEncargo = preorderCategories.filter((c) =>
      p.categories.includes(c.id),
    )
    if (inEncargo.length === 0) {
      uncategorized += 1
    } else {
      for (const c of inEncargo) {
        counts[c.id] = (counts[c.id] ?? 0) + 1
      }
    }
  }

  const chips = [
    ...preorderCategories.map((c) => ({
      id: c.id,
      name: c.name,
      count: counts[c.id] ?? 0,
    })),
    { id: "uncategorized", name: "Sin clasificar", count: uncategorized },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Por encargo
        </h2>
        <p className="text-sm text-muted-foreground">
          {products.length} productos. Filtra por colección, multi-selecciona y mueve a la categoría correcta.
        </p>
      </div>

      <PreordersView
        products={products}
        chips={chips}
        categories={preorderCategories}
      />
    </div>
  )
}
