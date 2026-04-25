import { ProductsListClient } from "@/components/admin/products-list-client"
import { getProducts, getProductCounts } from "@/lib/queries/products"

export default async function ProductsPage() {
  const [products, counts] = await Promise.all([
    getProducts({ limit: 200 }),
    getProductCounts(),
  ])

  return <ProductsListClient products={products} counts={counts} />
}
