import { Truck } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function ShippingPage() {
  return (
    <PageStub
      title="Zonas de envío"
      description="Configura provincias, costos de envío y tiempos estimados."
      icon={Truck}
      todo={[
        "Crear zonas con grupos de provincias",
        "Definir costo de envío por zona",
        "Configurar envío gratis sobre cierto monto",
        "Tiempos estimados de entrega",
        "Activar/desactivar zonas según operación",
      ]}
    />
  )
}
