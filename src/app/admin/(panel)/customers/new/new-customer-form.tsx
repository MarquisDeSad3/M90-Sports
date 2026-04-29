"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createCustomerAction } from "../actions"

const COUNTRIES = [
  { value: "CU", label: "Cuba" },
  { value: "US", label: "Estados Unidos" },
  { value: "ES", label: "España" },
  { value: "MX", label: "México" },
  { value: "CA", label: "Canadá" },
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "VE", label: "Venezuela" },
  { value: "PE", label: "Perú" },
  { value: "UY", label: "Uruguay" },
  { value: "DE", label: "Alemania" },
  { value: "FR", label: "Francia" },
  { value: "IT", label: "Italia" },
  { value: "PT", label: "Portugal" },
  { value: "OT", label: "Otro" },
] as const

export function NewCustomerForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [country, setCountry] = React.useState<string>("CU")
  const [notes, setNotes] = React.useState("")
  const [marketingConsent, setMarketingConsent] = React.useState(false)

  const isDiaspora = country !== "CU"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError("Falta el nombre del cliente.")
      return
    }
    if (phone.trim().length < 6) {
      setError("Falta el teléfono.")
      return
    }

    setSubmitting(true)
    const result = await createCustomerAction({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      country,
      isDiaspora,
      notes: notes.trim() || undefined,
      marketingConsent,
    })
    if (result.ok) {
      router.push(`/admin/customers/${result.customerId}`)
    } else {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Link
        href="/admin/customers"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-primary" />
            Datos del cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre completo *" className="md:col-span-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yoel Rodríguez"
              required
              maxLength={120}
            />
          </Field>

          <Field label="Teléfono *" hint="Sin espacios. Con código país.">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5363285022"
              required
              maxLength={20}
            />
          </Field>

          <Field label="Email (opcional)">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@correo.com"
              maxLength={120}
            />
          </Field>

          <Field label="País *">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-end">
            <div
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-xs",
                isDiaspora
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900",
              )}
            >
              <span className="font-semibold">
                {isDiaspora ? "Diáspora" : "En Cuba"}
              </span>
              <span className="text-muted-foreground">
                · auto-detectado del país
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extras</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Field label="Notas internas (opcional)" hint="Solo admin">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej: cliente recurrente del barrio, prefiere talla M"
            />
          </Field>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <Switch
              checked={marketingConsent}
              onCheckedChange={setMarketingConsent}
            />
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm font-medium">
                Acepta marketing
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Cuando empecemos con email/WhatsApp masivo, este flag controla
                si recibe campañas.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" asChild disabled={submitting}>
          <Link href="/admin/customers">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Crear cliente
        </Button>
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  )
}
