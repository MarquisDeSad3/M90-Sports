import { Star } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function ReviewsPage() {
  return (
    <PageStub
      title="Reseñas"
      description="Modera reseñas con foto del cliente — el contenido que más vende jerseys."
      icon={Star}
      todo={[
        "Cola de reseñas pendientes de aprobación",
        "Aprobar, rechazar o destacar reseñas",
        "Responder públicamente a la reseña",
        "Filtrar por rating, producto y estado",
        "Solo de clientes verificados (con compra real)",
      ]}
    />
  )
}
