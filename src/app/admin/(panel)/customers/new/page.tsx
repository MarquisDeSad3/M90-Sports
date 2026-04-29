import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import { NewCustomerForm } from "./new-customer-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NewCustomerPage() {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) {
    redirect("/admin")
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Nuevo cliente
        </h2>
        <p className="text-sm text-muted-foreground">
          Registra un cliente que te contactó por WhatsApp o que compró
          fuera del sistema. Si el teléfono ya existe te llevamos al
          perfil correspondiente.
        </p>
      </div>

      <NewCustomerForm />
    </div>
  )
}
