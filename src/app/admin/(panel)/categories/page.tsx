import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import { getCategories } from "@/lib/queries/categories"
import { CategoriesManager } from "./categories-manager"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CategoriesPage() {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const categories = await getCategories()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Catálogo</p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Categorías
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Las categorías que crees aquí se guardan en la base de datos.
          Las pestañas actuales del storefront (Todo · Clubes · Selecciones
          · Retro · NBA) siguen funcionando hasta que conectemos el
          storefront a esta tabla. Cuando estés listo, te lo conectamos.
        </p>
      </div>

      <CategoriesManager initial={categories} />
    </div>
  )
}
