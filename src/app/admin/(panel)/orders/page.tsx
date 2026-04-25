import { ShoppingCart } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function OrdersPage() {
  return (
    <PageStub
      title="Pedidos"
      description="Gestiona pedidos desde Cuba y la diáspora — pago, preparación, envío y entrega."
      icon={ShoppingCart}
      todo={[
        "Ver lista de pedidos con filtros por estado, método de pago y zona",
        "Detalle de cada pedido con cliente, productos y comprobante",
        "Cambiar estado: confirmado / preparando / enviado / entregado",
        "Ver pedidos del extranjero (Zelle/PayPal) vs Cuba (Transfermóvil)",
        "Notas internas para el equipo",
      ]}
    />
  )
}
