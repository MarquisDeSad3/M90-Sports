import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import {
  getAdminPreorderChipCounts,
  getAdminPreorderPage,
} from "@/lib/queries/admin-preorders"
import { PreordersView } from "./preorders-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string; cat?: string; q?: string }>
}

export default async function PreordersPage({ searchParams }: PageProps) {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const { page: rawPage, cat: rawCat, q: rawQ } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const cat = rawCat?.trim() || null
  const q = rawQ?.trim() || ""

  const [pageData, chipCounts] = await Promise.all([
    getAdminPreorderPage({
      page,
      pageSize: PAGE_SIZE,
      categoryId: cat,
      search: q,
    }),
    getAdminPreorderChipCounts(),
  ])

  const chips = [
    ...chipCounts.chips,
    {
      id: "uncategorized",
      name: "Sin clasificar",
      count: chipCounts.uncategorized,
    },
  ]

  const categories = chipCounts.chips.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Por encargo
        </h2>
        <p className="text-sm text-muted-foreground">
          {chipCounts.total.toLocaleString("es-CU")} productos. Filtra por
          colección, multi-selecciona y mueve a la categoría correcta.
        </p>
      </div>

      <PreordersView
        products={pageData.products}
        total={pageData.total}
        page={page}
        pageSize={PAGE_SIZE}
        activeCategory={cat}
        searchQuery={q}
        chips={chips}
        categories={categories}
      />
    </div>
  )
}
