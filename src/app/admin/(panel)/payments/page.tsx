import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import {
  getPayments,
  getPaymentCounts,
  type PaymentFilter,
} from "@/lib/queries/payments"
import { PaymentsClient } from "./client"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) {
    redirect("/admin")
  }

  const params = await searchParams
  const raw = params.filter as PaymentFilter | undefined
  const filter: PaymentFilter =
    raw === "verified" || raw === "rejected" || raw === "all"
      ? raw
      : "pending"

  const [items, counts] = await Promise.all([
    getPayments(filter),
    getPaymentCounts(),
  ])

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Pagos
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica comprobantes de Transfermóvil, Zelle y PayPal antes de
          procesar pedidos.
        </p>
      </div>

      <PaymentsClient items={items} counts={counts} filter={filter} />
    </div>
  )
}
