import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import { getProduct } from "@/lib/queries/products"
import { getCategories } from "@/lib/queries/categories"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const [admin, product, categories] = await Promise.all([
    requireAdmin(),
    getProduct(id),
    getCategories(),
  ])
  if (!product) notFound()

  // Only owners and managers see (and can set) the unit cost — staff
  // and viewers don't need margin information to fulfill orders.
  const canSeeCost = isAtLeastManager(admin.admin.role)
  const safe = canSeeCost ? product : { ...product, costPerItem: undefined }

  return (
    <ProductForm
      mode="edit"
      product={safe}
      canSeeCost={canSeeCost}
      availableCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  )
}
