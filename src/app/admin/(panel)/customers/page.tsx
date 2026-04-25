import { Users } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function CustomersPage() {
  return (
    <PageStub
      title="Clientes"
      description="Tu base de clientes — diáspora y Cuba — con historial completo."
      icon={Users}
      todo={[
        "Lista de clientes con filtro Cuba / exterior",
        "Histórico de pedidos y total gastado por cliente",
        "Ver direcciones guardadas",
        "Notas internas y etiquetas",
        "Exportar a CSV",
      ]}
    />
  )
}
