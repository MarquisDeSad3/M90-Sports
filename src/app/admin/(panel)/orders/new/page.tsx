import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import { getSettingValues } from "@/lib/queries/settings"
import { ManualOrderForm } from "./manual-order-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NewOrderPage() {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) {
    redirect("/admin")
  }

  const addonSettings = await getSettingValues([
    "addon.longSleevesPrice",
    "addon.patchesPrice",
    "addon.personalizationPrice",
    "addon.personalizationDepositPct",
  ])

  const addonPrices = {
    longSleeves: Number(addonSettings["addon.longSleevesPrice"] ?? 1),
    patches: Number(addonSettings["addon.patchesPrice"] ?? 3),
    personalization: Number(addonSettings["addon.personalizationPrice"] ?? 5),
    personalizationDepositPct: Number(
      addonSettings["addon.personalizationDepositPct"] ?? 50,
    ),
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Nuevo pedido manual
        </h2>
        <p className="text-sm text-muted-foreground">
          Cuando un cliente te lo pidió por WhatsApp y necesitas registrarlo
          aquí. El pedido entra como confirmado, saltándose la cola pública.
        </p>
      </div>

      <ManualOrderForm addonPrices={addonPrices} />
    </div>
  )
}
