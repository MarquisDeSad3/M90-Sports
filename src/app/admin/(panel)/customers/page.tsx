import { Users } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function CustomersPage() {
  return (
    <PageStub
      title="Clientes"
      description="Quién compra, qué compra y dónde lo recibe."
      icon={Users}
    />
  )
}
