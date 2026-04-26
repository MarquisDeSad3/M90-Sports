import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import {
  getCustomRequests,
  getCustomRequestCounts,
} from "@/lib/queries/custom-requests"
import { CustomRequestsClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CustomRequestsPage() {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) {
    redirect("/admin")
  }

  const [items, counts] = await Promise.all([
    getCustomRequests(),
    getCustomRequestCounts(),
  ])

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Pedidos a medida
        </h2>
        <p className="text-sm text-muted-foreground">
          Solicitudes de cotización. Revisa, pon precio y responde por WhatsApp.
        </p>
      </div>

      <CustomRequestsClient initial={items} counts={counts} />
    </div>
  )
}
