import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { getPreorderPicker } from "@/lib/queries/preorder-picker"

export default async function ProductsPage() {
  const [products, counts, categories, preorderPool] = await Promise.all([
    // Exclude preorders — those live in /admin/preorders. The regular
    // catalog (what shows on the front page) stays focused here.
    getProducts({ limit: 2000, isPreorder: false }),
    getProductCounts({ isPreorder: false }),
    getCategories(),
    getPreorderPicker(),
  ])

  // Hide the preorder hierarchy from the regular catalog admin —
  // those live in /admin/preorders. We exclude both the "por-encargo"
  // parent and its children (encargo-*) so the chip row stays focused.
  const catalogCategories = categories.filter(
    (c) => !c.slug.startsWith("encargo-") && c.slug !== "por-encargo",
  )

  return (
    <ProductsListClient
      products={products}
      counts={counts}
      categories={catalogCategories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: c.productCount,
      }))}
      preorderPool={preorderPool}
    />
  )
}
