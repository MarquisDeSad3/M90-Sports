import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastManager } from "@/lib/auth/roles"
import {
  CUBA_PROVINCES,
  getShippingZones,
} from "@/lib/queries/shipping"
import { ShippingClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ShippingPage() {
  const acting = await requireAdmin()
  if (!isAtLeastManager(acting.admin.role)) {
    redirect("/admin")
  }

  const zones = await getShippingZones()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Zonas de envío
        </h2>
        <p className="text-sm text-muted-foreground">
          Configura provincias, costos y tiempos de entrega.
        </p>
      </div>

      <ShippingClient
        zones={zones}
        allProvinces={[...CUBA_PROVINCES]}
      />
    </div>
  )
}
