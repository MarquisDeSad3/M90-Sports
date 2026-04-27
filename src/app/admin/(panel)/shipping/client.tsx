"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Truck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { ShippingZoneRecord } from "@/lib/queries/shipping"
import {
  deleteShippingZoneAction,
  saveShippingZoneAction,
  toggleShippingZoneAction,
  type ActionResult,
} from "./actions"

const initialState: ActionResult = { ok: false, error: "" }

interface Props {
  zones: ShippingZoneRecord[]
  allProvinces: string[]
}

export function ShippingClient({ zones, allProvinces }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {/* Header + create */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {zones.length} {zones.length === 1 ? "zona" : "zonas"} configurada{zones.length === 1 ? "" : "s"}
        </div>
        <Button
          onClick={() => setCreateOpen((v) => !v)}
          size="sm"
          variant={createOpen ? "outline" : "default"}
          className="gap-2"
        >
          {createOpen ? (
            <>
              <X className="size-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" /> Nueva zona
            </>
          )}
        </Button>
      </div>

      {createOpen && (
        <ZoneForm
          allProvinces={allProvinces}
          existingZones={zones}
          onDone={() => setCreateOpen(false)}
        />
      )}

      {/* Zone list */}
      {zones.length === 0 && !createOpen ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Truck className="size-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Sin zonas configuradas. Crea una para empezar a cobrar envíos.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-3.5" />
              Primera zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {zones.map((z) => (
            <ZoneCard
              key={z.id}
              zone={z}
              isEditing={editingId === z.id}
              onEdit={() =>
                setEditingId((v) => (v === z.id ? null : z.id))
              }
              allProvinces={allProvinces}
              existingZones={zones}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ZoneCard({
  zone,
  isEditing,
  onEdit,
  allProvinces,
  existingZones,
}: {
  zone: ShippingZoneRecord
  isEditing: boolean
  onEdit: () => void
  allProvinces: string[]
  existingZones: ShippingZoneRecord[]
}) {
  return (
    <Card
      className={cn(
        !zone.active && "opacity-60",
        isEditing && "ring-2 ring-primary/40",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-primary" />
            {zone.name}
          </CardTitle>
          <span className="font-display text-2xl tabular-nums">
            ${zone.baseCost.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ToggleActive id={zone.id} active={zone.active} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="size-8 p-0"
          >
            {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-0">
        <div className="flex flex-wrap gap-1">
          {zone.provinces.map((p) => (
            <Badge
              key={p}
              variant="secondary"
              className="text-[10px] font-medium"
            >
              {p}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {zone.estimatedDaysMin !== null &&
            zone.estimatedDaysMax !== null && (
              <span>
                Llega en{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {zone.estimatedDaysMin === zone.estimatedDaysMax
                    ? `${zone.estimatedDaysMin}`
                    : `${zone.estimatedDaysMin}–${zone.estimatedDaysMax}`}
                </span>{" "}
                {zone.estimatedDaysMax === 1 ? "día" : "días"}
              </span>
            )}
          {zone.freeShippingThreshold !== null && (
            <span>
              Gratis sobre{" "}
              <span className="font-semibold text-foreground tabular-nums">
                ${zone.freeShippingThreshold.toFixed(2)}
              </span>
            </span>
          )}
        </div>

        {isEditing && (
          <div className="mt-2 border-t pt-3">
            <ZoneForm
              zone={zone}
              allProvinces={allProvinces}
              existingZones={existingZones}
              onDone={onEdit}
              compact
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = React.useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      title={active ? "Desactivar zona" : "Activar zona"}
      onClick={() => {
        startTransition(async () => {
          await toggleShippingZoneAction(id, !active)
        })
      }}
      className={cn(
        "size-8 p-0",
        active
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : active ? (
        <Eye className="size-4" />
      ) : (
        <EyeOff className="size-4" />
      )}
    </Button>
  )
}

function ZoneForm({
  zone,
  allProvinces,
  existingZones,
  onDone,
  compact = false,
}: {
  zone?: ShippingZoneRecord
  allProvinces: string[]
  existingZones: ShippingZoneRecord[]
  onDone?: () => void
  compact?: boolean
}) {
  const [state, formAction, pending] = useActionState(
    saveShippingZoneAction,
    initialState,
  )
  const [selectedProvinces, setSelectedProvinces] = React.useState<Set<string>>(
    new Set(zone?.provinces ?? []),
  )
  const [active, setActive] = React.useState(zone?.active ?? true)

  React.useEffect(() => {
    if (state.ok && onDone) onDone()
  }, [state.ok, onDone])

  // Provinces already covered by *other* zones — visible but harder to
  // select, so the user can spot conflicts.
  const claimedByOthers = React.useMemo(() => {
    const claimed = new Map<string, string>()
    for (const z of existingZones) {
      if (z.id === zone?.id) continue
      for (const p of z.provinces) claimed.set(p, z.name)
    }
    return claimed
  }, [existingZones, zone?.id])

  const Wrapper = compact
    ? React.Fragment
    : ({ children }: { children: React.ReactNode }) => (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {zone ? "Editar zona" : "Nueva zona de envío"}
            </CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      )

  function toggleProvince(p: string) {
    setSelectedProvinces((cur) => {
      const next = new Set(cur)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  return (
    <Wrapper>
      <form action={formAction} className="flex flex-col gap-4">
        {zone && <input type="hidden" name="id" value={zone.id} />}
        <input
          type="hidden"
          name="provinces"
          value={Array.from(selectedProvinces).join(",")}
        />
        <input
          type="hidden"
          name="active"
          value={active ? "true" : "false"}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nombre" hint='Ej: "La Habana", "Oriente", "Diáspora"'>
            <Input
              name="name"
              defaultValue={zone?.name ?? ""}
              required
              maxLength={80}
              placeholder="La Habana metropolitana"
            />
          </Field>
          <Field label="Costo base (USD)">
            <Input
              name="baseCost"
              type="number"
              step="0.01"
              min="0"
              max="10000"
              defaultValue={zone?.baseCost ?? 5}
              required
              className="tabular-nums"
            />
          </Field>
        </div>

        <Field
          label="Provincias"
          hint={
            selectedProvinces.size === 0
              ? "Selecciona al menos una provincia"
              : `${selectedProvinces.size} provincia${
                  selectedProvinces.size === 1 ? "" : "s"
                } seleccionada${selectedProvinces.size === 1 ? "" : "s"}`
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {allProvinces.map((p) => {
              const selected = selectedProvinces.has(p)
              const claimedBy = claimedByOthers.get(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProvince(p)}
                  title={
                    claimedBy
                      ? `Ya está en "${claimedBy}". Mover a esta zona la quitará de la otra al guardar.`
                      : undefined
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : claimedBy
                        ? "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400"
                        : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {p}
                  {claimedBy && !selected && (
                    <span className="ml-1 text-[9px] opacity-60">
                      en {claimedBy}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Días mínimos" hint="Tiempo de entrega">
            <Input
              name="estimatedDaysMin"
              type="number"
              min="0"
              max="60"
              defaultValue={zone?.estimatedDaysMin ?? ""}
              placeholder="2"
              className="tabular-nums"
            />
          </Field>
          <Field label="Días máximos">
            <Input
              name="estimatedDaysMax"
              type="number"
              min="0"
              max="60"
              defaultValue={zone?.estimatedDaysMax ?? ""}
              placeholder="5"
              className="tabular-nums"
            />
          </Field>
          <Field label="Envío gratis sobre" hint="Vacío = nunca">
            <Input
              name="freeShippingThreshold"
              type="number"
              step="0.01"
              min="0"
              defaultValue={zone?.freeShippingThreshold ?? ""}
              placeholder="50.00"
              className="tabular-nums"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label className="text-sm">Zona activa</Label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={pending || selectedProvinces.size === 0}
              size="sm"
              className="gap-2"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {zone ? "Guardar" : "Crear zona"}
            </Button>
            {!state.ok && state.error && (
              <span className="text-sm text-rose-600">{state.error}</span>
            )}
            {state.ok && (
              <span className="text-xs text-emerald-600">Guardado</span>
            )}
          </div>
          {zone && <DeleteZoneButton id={zone.id} />}
        </div>
      </form>
    </Wrapper>
  )
}

function DeleteZoneButton({ id }: { id: string }) {
  const [confirming, setConfirming] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  return (
    <Button
      type="button"
      variant={confirming ? "destructive" : "ghost"}
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirming) {
          setConfirming(true)
          return
        }
        startTransition(async () => {
          await deleteShippingZoneAction(id)
        })
      }}
      className="gap-1.5"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
      {confirming ? "Confirmar" : "Eliminar"}
    </Button>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}
