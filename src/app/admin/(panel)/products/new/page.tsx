import { ProductForm } from "@/components/admin/product-form"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"

export default async function NewProductPage() {
  const admin = await requireAdmin()
  return (
    <ProductForm
      mode="create"
      canSeeCost={isAtLeastManager(admin.admin.role)}
    />
  )
}
