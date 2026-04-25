import { Wallet } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function PaymentsPage() {
  return (
    <PageStub
      title="Pagos"
      description="Verifica comprobantes de Transfermóvil, Zelle y PayPal antes de procesar pedidos."
      icon={Wallet}
      todo={[
        "Cola de pagos pendientes con screenshot de comprobante",
        "Aprobar o rechazar pagos con un click",
        "Ver referencia de transacción y monto",
        "Histórico de pagos verificados por admin",
        "Alertas para pagos sin verificar +1h",
      ]}
    />
  )
}
