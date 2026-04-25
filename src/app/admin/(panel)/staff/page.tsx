import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isOwner } from "@/lib/auth/roles"
import { getStaff } from "@/lib/queries/staff"
import { StaffManager } from "./staff-manager"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StaffPage() {
  const acting = await requireAdmin()
  if (!isOwner(acting.admin.role)) {
    // Only owners manage the team. Bounce non-owners back to the dashboard.
    redirect("/admin")
  }

  const staff = await getStaff()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Solo el dueño accede aquí</p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Equipo del panel
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea cuentas para tu equipo, asigna su rol y revoca acceso cuando
          necesites. Cambiar el rol o eliminar a alguien cierra sus sesiones
          al instante.
        </p>
      </div>

      <StaffManager initial={staff} currentAdminId={acting.admin.id} />
    </div>
  )
}
