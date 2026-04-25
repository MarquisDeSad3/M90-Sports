import { Sparkles } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function CustomRequestsPage() {
  return (
    <PageStub
      title="Pedidos a medida"
      description="Solicitudes especiales de clientes que quieren un jersey que no está en el catálogo."
      icon={Sparkles}
      todo={[
        "Ver solicitudes pendientes con foto/link de referencia",
        "Cotizar precio y responder al cliente",
        "Convertir solicitud aceptada en pedido normal",
        "Histórico de solicitudes (aceptadas, rechazadas, convertidas)",
      ]}
    />
  )
}
