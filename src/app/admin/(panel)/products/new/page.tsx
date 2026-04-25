import { ProductForm } from "@/components/admin/product-form"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import { getCategories } from "@/lib/queries/categories"

export default async function NewProductPage() {
  const [admin, categories] = await Promise.all([
    requireAdmin(),
    getCategories(),
  ])
  return (
    <ProductForm
      mode="create"
      canSeeCost={isAtLeastManager(admin.admin.role)}
      availableCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  )
}
