import { Ticket } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function CouponsPage() {
  return (
    <PageStub
      title="Cupones"
      description="Crea descuentos y promociones para tus clientes."
      icon={Ticket}
      todo={[
        "Crear cupones por porcentaje, monto fijo o envío gratis",
        "Limitar uso por cliente y total",
        "Aplicar a productos, categorías o todo el catálogo",
        "Configurar fechas de inicio y caducidad",
      ]}
    />
  )
}
