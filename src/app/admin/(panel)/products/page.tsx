import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"

export default async function ProductsPage() {
  const [products, counts, categories] = await Promise.all([
    getProducts({ limit: 200 }),
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
