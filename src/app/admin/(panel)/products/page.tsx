import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"

export default async function ProductsPage() {
  const [products, counts, categories] = await Promise.all([
    // We paginate client-side at 50/page, so we still need every row
    // up front. 2000 is plenty for the current catalog (~1300 items)
    // with margin. If we ever cross 2000, move pagination to the server.
    getProducts({ limit: 2000 }),
    getProductCounts(),
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
