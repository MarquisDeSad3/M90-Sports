import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"

export default async function ProductsPage() {
  const [products, counts, categories] = await Promise.all([
    // 1000 covers the current catalog comfortably. If we ever cross
    // that, swap to real pagination in the client.
    getProducts({ limit: 1000 }),
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
