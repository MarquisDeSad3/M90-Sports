import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import { getCoupons } from "@/lib/queries/coupons"
import { CouponsClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CouponsPage() {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const items = await getCoupons()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Cupones
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea descuentos por porcentaje, monto fijo o envío gratis.
        </p>
      </div>

      <CouponsClient items={items} />
    </div>
  )
}
