import { Settings } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function SettingsPage() {
  return (
    <PageStub
      title="Configuración"
      description="Marca, monedas, métodos de pago y datos de contacto."
      icon={Settings}
      todo={[
        "Datos generales del negocio (nombre, logo, contacto)",
        "Métodos de pago activos y cuentas asociadas",
        "Tasas de cambio: USD / CUP / MLC / EUR",
        "Configurar WhatsApp, redes sociales, pixel de Meta",
        "Plantillas de email y WhatsApp para notificaciones",
      ]}
    />
  )
}
