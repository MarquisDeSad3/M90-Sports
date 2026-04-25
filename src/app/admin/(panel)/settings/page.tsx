import { getSiteSettings } from "@/lib/queries/settings"
import { SettingsForm } from "./settings-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Configuración del sitio</p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Ajustes
        </h2>
        <p className="text-sm text-muted-foreground">
          Datos del negocio, métodos de pago, costos de envío y redes
          sociales. Los cambios se aplican al instante.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </div>
  )
}
