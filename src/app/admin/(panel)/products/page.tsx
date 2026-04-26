import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"

export default async function ProductsPage() {
  const [products, counts, categories] = await Promise.all([
    // Exclude preorders — those live in /admin/preorders. The regular
    // catalog (what shows on the front page) stays focused here.
    getProducts({ limit: 2000, isPreorder: false }),
    getProductCounts({ isPreorder: false }),
    getCategories(),
  ])

  return (
    <ProductsListClient
      products={products}
      counts={counts}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        productCount: c.productCount,
      }))}
    />
  )
}
