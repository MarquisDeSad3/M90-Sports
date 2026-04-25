import { requireAdmin } from "@/lib/auth"
import { ProfileForms } from "./profile-forms"

export const dynamic = "force-dynamic"
export const revalidate = 0

const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  manager: "Manager",
  staff: "Staff",
  viewer: "Solo lectura",
}

export default async function ProfilePage() {
  const acting = await requireAdmin()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Mi perfil
        </h2>
        <p className="text-sm text-muted-foreground">
          Tu nombre, foto y contraseña.
        </p>
      </div>

      <ProfileForms
        initial={{
          name: acting.admin.name,
          email: acting.admin.email,
          photoUrl: acting.admin.photoUrl,
          role: ROLE_LABEL[acting.admin.role] ?? acting.admin.role,
        }}
      />
    </div>
  )
}
