"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Calendar,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Percent,
  Pencil,
  Plus,
  Tag,
  Ticket,
  Trash2,
  Truck,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import type { CouponRecord, CouponType } from "@/lib/queries/coupons"
import {
  deleteCouponAction,
  saveCouponAction,
  toggleCouponAction,
  type ActionResult,
} from "./actions"

const initialState: ActionResult = { ok: false, error: "" }

const TYPE_LABEL: Record<CouponType, string> = {
  percentage: "% Descuento",
  fixed_amount: "$ Fijo",
  free_shipping: "Envío gratis",
}

interface Props {
  items: CouponRecord[]
}

export function CouponsClient({ items }: Props) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const active = items.filter((c) => c.active && !isExpired(c))
  const expired = items.filter((c) => isExpired(c))
  const inactive = items.filter((c) => !c.active && !isExpired(c))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground tabular-nums">
          {items.length} cupón{items.length === 1 ? "" : "es"} ·{" "}
          <span className="text-emerald-700">{active.length} activos</span>
          {expired.length > 0 && (
            <span className="text-rose-700"> · {expired.length} vencidos</span>
          )}
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
              <Plus className="size-4" /> Nuevo cupón
            </>
          )}
        </Button>
      </div>

      {createOpen && <CouponForm onDone={() => setCreateOpen(false)} />}

      {items.length === 0 && !createOpen ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Ticket className="size-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Sin cupones todavía. Crea el primero para lanzar una promo.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-3.5" />
              Primer cupón
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              isEditing={editingId === c.id}
              onEdit={() =>
                setEditingId((v) => (v === c.id ? null : c.id))
              }
            />
          ))}
        </div>
      )}

      {inactive.length === 0 ? null : null}
    </div>
  )
}

function CouponCard({
  coupon,
  isEditing,
  onEdit,
}: {
  coupon: CouponRecord
  isEditing: boolean
  onEdit: () => void
}) {
  const expired = isExpired(coupon)
  const exhausted =
    coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses

  const typeIcon = {
    percentage: Percent,
    fixed_amount: Tag,
    free_shipping: Truck,
  }[coupon.type]
  const TypeIcon = typeIcon

  return (
    <Card
      className={cn(
        (expired || !coupon.active) && "opacity-60",
        isEditing && "ring-2 ring-primary/40",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <TypeIcon className="size-4 text-primary" />
            <span className="font-mono tracking-wider">{coupon.code}</span>
          </CardTitle>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl tabular-nums">
              {coupon.type === "percentage"
                ? `${coupon.value}%`
                : coupon.type === "fixed_amount"
                  ? `$${coupon.value.toFixed(2)}`
                  : "Gratis"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[coupon.type]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ToggleActive id={coupon.id} active={coupon.active} />
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
      <CardContent className="flex flex-col gap-2 pt-0">
        <div className="flex flex-wrap gap-1.5">
          {expired && (
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-[10px] text-rose-900"
            >
              Vencido
            </Badge>
          )}
          {exhausted && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-900"
            >
              Agotado
            </Badge>
          )}
          {!coupon.active && !expired && (
            <Badge variant="secondary" className="text-[10px]">
              Inactivo
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {coupon.minPurchase !== null && (
            <Field
              label="Mín. compra"
              value={`$${coupon.minPurchase.toFixed(2)}`}
            />
          )}
          <Field
            label="Usos"
            value={
              <span className="tabular-nums">
                {coupon.usedCount}
                {coupon.maxUses !== null && ` / ${coupon.maxUses}`}
              </span>
            }
          />
          <Field
            label="Por cliente"
            value={
              <span className="tabular-nums">
                {coupon.maxUsesPerCustomer}
              </span>
            }
          />
          {coupon.expiresAt && (
            <Field
              label="Vence"
              value={
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(coupon.expiresAt)}
                </span>
              }
            />
          )}
        </div>

        {isEditing && (
          <div className="mt-2 border-t pt-3">
            <CouponForm coupon={coupon} onDone={onEdit} compact />
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
      title={active ? "Desactivar" : "Activar"}
      onClick={() => {
        startTransition(async () => {
          await toggleCouponAction(id, !active)
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

function CouponForm({
  coupon,
  onDone,
  compact = false,
}: {
  coupon?: CouponRecord
  onDone?: () => void
  compact?: boolean
}) {
  const [state, formAction, pending] = useActionState(
    saveCouponAction,
    initialState,
  )
  const [type, setType] = React.useState<CouponType>(
    coupon?.type ?? "percentage",
  )
  const [active, setActive] = React.useState(coupon?.active ?? true)

  React.useEffect(() => {
    if (state.ok && onDone) onDone()
  }, [state.ok, onDone])

  const Wrapper = compact
    ? React.Fragment
    : ({ children }: { children: React.ReactNode }) => (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {coupon ? "Editar cupón" : "Nuevo cupón"}
            </CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      )

  return (
    <Wrapper>
      <form action={formAction} className="flex flex-col gap-4">
        {coupon && <input type="hidden" name="id" value={coupon.id} />}
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="active" value={active ? "true" : "false"} />

        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Código"
            hint="Solo MAYÚSCULAS, números, guion y _"
          >
            <Input
              name="code"
              defaultValue={coupon?.code ?? ""}
              required
              maxLength={40}
              placeholder="VERANO25"
              className="font-mono uppercase tracking-wider"
              style={{ textTransform: "uppercase" }}
            />
          </Field>
          <Field label="Tipo">
            <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">% Descuento</SelectItem>
                <SelectItem value="fixed_amount">$ Monto fijo</SelectItem>
                <SelectItem value="free_shipping">Envío gratis</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {type !== "free_shipping" && (
          <Field
            label={type === "percentage" ? "Porcentaje" : "Monto en USD"}
            hint={type === "percentage" ? "Ej: 25 = 25% off" : "Ej: 5.00 = $5"}
          >
            <Input
              name="value"
              type="number"
              step={type === "percentage" ? "1" : "0.01"}
              min="0"
              max={type === "percentage" ? "100" : "10000"}
              defaultValue={coupon?.value ?? ""}
              required
              className="tabular-nums"
            />
          </Field>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Compra mínima" hint="USD, vacío = sin mínimo">
            <Input
              name="minPurchase"
              type="number"
              step="0.01"
              min="0"
              defaultValue={coupon?.minPurchase ?? ""}
              placeholder="0"
              className="tabular-nums"
            />
          </Field>
          <Field label="Usos totales" hint="Vacío = ilimitado">
            <Input
              name="maxUses"
              type="number"
              min="1"
              defaultValue={coupon?.maxUses ?? ""}
              placeholder="100"
              className="tabular-nums"
            />
          </Field>
          <Field label="Por cliente">
            <Input
              name="maxUsesPerCustomer"
              type="number"
              min="1"
              max="100"
              defaultValue={coupon?.maxUsesPerCustomer ?? 1}
              required
              className="tabular-nums"
            />
          </Field>
        </div>

        <Field label="Vence el" hint="Vacío = sin caducidad">
          <Input
            name="expiresAt"
            type="datetime-local"
            defaultValue={
              coupon?.expiresAt
                ? toLocalInputValue(coupon.expiresAt)
                : ""
            }
          />
        </Field>

        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label className="text-sm">Cupón activo</Label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} size="sm" className="gap-2">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {coupon ? "Guardar" : "Crear cupón"}
            </Button>
            {!state.ok && state.error && (
              <span className="text-sm text-rose-600">{state.error}</span>
            )}
            {state.ok && (
              <span className="text-xs text-emerald-600">Guardado</span>
            )}
          </div>
          {coupon && <DeleteCouponButton id={coupon.id} />}
        </div>
      </form>
    </Wrapper>
  )
}

function DeleteCouponButton({ id }: { id: string }) {
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
          await deleteCouponAction(id)
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
  value,
  hint,
  children,
}: {
  label: string
  value?: React.ReactNode
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      {children ?? <span>{value}</span>}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

function isExpired(c: CouponRecord): boolean {
  return c.expiresAt !== null && c.expiresAt.getTime() < Date.now()
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(d)
}

function toLocalInputValue(d: Date): string {
  // datetime-local needs YYYY-MM-DDTHH:mm in *local* time, not ISO UTC.
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
