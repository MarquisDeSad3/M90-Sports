import { ShieldUser } from "lucide-react"
import { PageStub } from "@/components/admin/page-stub"

export default function StaffPage() {
  return (
    <PageStub
      title="Equipo"
      description="Gestiona los administradores y permisos del panel."
      icon={ShieldUser}
      todo={[
        "Invitar nuevos managers o staff por email",
        "Asignar roles: Owner, Manager, Staff, Viewer",
        "Activar/revocar acceso de un click",
        "Ver actividad reciente de cada admin",
        "Configurar 2FA obligatorio",
      ]}
    />
  )
}
