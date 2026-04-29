import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import {
  getCustomers,
  getCustomerCounts,
  type CustomerSegment,
} from "@/lib/queries/customers"
import { CustomersClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ segment?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) {
    redirect("/admin")
  }

  const params = await searchParams
  const raw = params.segment as CustomerSegment | undefined
  const segment: CustomerSegment =
    raw === "diaspora" ||
    raw === "cuba" ||
    raw === "vip" ||
    raw === "lapsed"
      ? raw
      : "all"

  const [items, counts] = await Promise.all([
    getCustomers({ segment }),
    getCustomerCounts(),
  ])

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Clientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Quién compra, qué compra y dónde lo recibe.
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/admin/customers/new">
            <Plus className="size-4" />
            <span>Nuevo cliente</span>
          </Link>
        </Button>
      </div>

      <CustomersClient items={items} counts={counts} segment={segment} />
    </div>
  )
}
