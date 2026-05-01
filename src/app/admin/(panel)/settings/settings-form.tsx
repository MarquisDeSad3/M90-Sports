"use client"

import * as React from "react"
import { useActionState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  saveSettingsAction,
  type SaveSettingsState,
} from "./actions"
import type { SiteSettings } from "@/lib/queries/settings"

const initialState: SaveSettingsState = { ok: false, message: "" }

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [state, formAction, pending] = useActionState(
    saveSettingsAction,
    initialState,
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Negocio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre del negocio">
            <Input
              name="business.name"
              defaultValue={initial.business.name}
              required
              maxLength={120}
            />
          </Field>
          <Field label="Email de contacto">
            <Input
              type="email"
              name="business.email"
              defaultValue={initial.business.email}
              required
              maxLength={120}
            />
          </Field>
          <Field
            label="Número de WhatsApp"
            hint="Sin espacios ni guiones — ej: 5363285022"
          >
            <Input
              name="business.whatsappNumber"
              defaultValue={initial.business.whatsappNumber}
              required
              maxLength={20}
            />
          </Field>
          <Field
            label="Mensaje por defecto de WhatsApp"
            hint="Texto que ve el cliente al pulsar el botón flotante"
            className="md:col-span-2"
          >
            <Input
              name="business.whatsappDefaultMessage"
              defaultValue={initial.business.whatsappDefaultMessage}
              maxLength={500}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métodos de pago</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <PaymentRow
            name="cashOnDelivery"
            label="Efectivo a la entrega"
            defaultEnabled={initial.payments.cashOnDeliveryEnabled}
          />
          <Separator />
          <PaymentRow
            name="zelle"
            label="Zelle"
            defaultEnabled={initial.payments.zelleEnabled}
            accountField={{
              name: "payments.zelleEmail",
              defaultValue: initial.payments.zelleEmail,
              placeholder: "tu-email-zelle@ejemplo.com",
            }}
          />
          <Separator />
          <PaymentRow
            name="paypal"
            label="PayPal"
            defaultEnabled={initial.payments.paypalEnabled}
            accountField={{
              name: "payments.paypalEmail",
              defaultValue: initial.payments.paypalEmail,
              placeholder: "tu-email-paypal@ejemplo.com",
            }}
          />
        </CardContent>
      </Card>

      {/* Envíos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costos de envío (USD)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="La Habana">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.habanaCost"
              defaultValue={initial.shipping.habanaCost}
            />
          </Field>
          <Field label="Mayabeque">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.mayabequeCost"
              defaultValue={initial.shipping.mayabequeCost}
            />
          </Field>
          <Field label="Artemisa">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.artemisaCost"
              defaultValue={initial.shipping.artemisaCost}
            />
          </Field>
          <Field label="Matanzas">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.matanzasCost"
              defaultValue={initial.shipping.matanzasCost}
            />
          </Field>
          <Field label="Pinar del Río">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.pinarCost"
              defaultValue={initial.shipping.pinarCost}
            />
          </Field>
          <Field
            label="Recargo diáspora"
            hint="Suma fija si paga desde el exterior"
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000"
              name="shipping.diasporaSurcharge"
              defaultValue={initial.shipping.diasporaSurcharge}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Sociales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Instagram">
            <Input
              name="social.instagram"
              defaultValue={initial.social.instagram}
              placeholder="https://instagram.com/..."
              maxLength={200}
            />
          </Field>
          <Field label="Facebook">
            <Input
              name="social.facebook"
              defaultValue={initial.social.facebook}
              placeholder="https://facebook.com/..."
              maxLength={200}
            />
          </Field>
          <Field label="TikTok">
            <Input
              name="social.tiktok"
              defaultValue={initial.social.tiktok}
              placeholder="https://tiktok.com/@..."
              maxLength={200}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Pedidos por encargo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos por encargo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            label="% de depósito"
            hint="Lo que el cliente paga al hacer el pedido. El resto se paga cuando llegue a Cuba."
          >
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              name="preorder.depositPercentage"
              defaultValue={initial.preorder.depositPercentage}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        {state.message && (
          <span
            className={`text-sm ${
              state.ok ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

function PaymentRow({
  name,
  label,
  defaultEnabled,
  accountField,
}: {
  name: string
  label: string
  defaultEnabled: boolean
  accountField?: {
    name: string
    defaultValue: string
    placeholder: string
  }
}) {
  const [enabled, setEnabled] = React.useState(defaultEnabled)
  const switchName = `payments.${name}Enabled`
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Switch
          name={switchName}
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor={switchName} className="text-sm font-medium">
          {label}
        </Label>
      </div>
      {accountField && enabled && (
        <Input
          name={accountField.name}
          defaultValue={accountField.defaultValue}
          placeholder={accountField.placeholder}
          maxLength={120}
          className="md:max-w-md"
        />
      )}
    </div>
  )
}
