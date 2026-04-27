"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  PaymentCounts,
  PaymentFilter,
  PaymentMethod,
  PaymentRecord,
} from "@/lib/queries/payments"
import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "./actions"

const METHOD_LABEL: Record<PaymentMethod, string> = {
  transfermovil: "Transfermóvil",
  zelle: "Zelle",
  paypal: "PayPal",
  cash_on_delivery: "Efectivo (entrega)",
}

const METHOD_TONE: Record<PaymentMethod, string> = {
  transfermovil: "bg-blue-50 text-blue-900 ring-blue-200",
  zelle: "bg-purple-50 text-purple-900 ring-purple-200",
  paypal: "bg-sky-50 text-sky-900 ring-sky-200",
  cash_on_delivery: "bg-amber-50 text-amber-900 ring-amber-200",
}

interface Props {
  items: PaymentRecord[]
  counts: PaymentCounts
  filter: PaymentFilter
}

export function PaymentsClient({ items, counts, filter }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter((p) =>
      [
        p.orderNumber,
        p.customerName ?? "",
        p.customerPhone ?? "",
        p.transactionRef ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [items, search])

  function setFilter(next: PaymentFilter) {
    const params = new URLSearchParams(searchParams)
    if (next === "pending") params.delete("filter")
    else params.set("filter", next)
    const qs = params.toString()
    router.push(`/admin/payments${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Pendientes"
          value={counts.pending}
          tone="warning"
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        />
        <StatTile
          label="Verificados"
          value={counts.verified}
          tone="success"
          active={filter === "verified"}
          onClick={() => setFilter("verified")}
        />
        <StatTile
          label="Rechazados"
          value={counts.rejected}
          tone="destructive"
          active={filter === "rejected"}
          onClick={() => setFilter("rejected")}
        />
        <StatTile
          label="Todos"
          value={counts.total}
          tone="neutral"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
      </div>

      {/* Search */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido, cliente, teléfono o referencia…"
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "pago" : "pagos"}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            {filter === "pending" ? (
              <>
                <div className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="size-5" />
                </div>
                <p className="text-sm font-semibold">
                  Sin pagos pendientes de verificar.
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Cuando un cliente suba un comprobante, aparece acá para
                  aprobar o rechazar.
                </p>
              </>
            ) : (
              <>
                <Wallet className="size-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? `Sin resultados para "${search}"`
                    : "Sin pagos en este filtro."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </ul>
      )}
    </div>
  )
}

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const router = useRouter()

  const isPending = payment.status === "proof_uploaded"
  const isVerified = payment.status === "verified"
  const isRejected = payment.status === "failed"

  function handleVerify() {
    setFeedback(null)
    startTransition(async () => {
      const res = await verifyPaymentAction(payment.id)
      if (res.ok) {
        setFeedback({ kind: "ok", text: "Pago verificado." })
        router.refresh()
      } else {
        setFeedback({ kind: "err", text: res.error })
      }
    })
  }

  function handleReject() {
    if (!reason.trim()) {
      setFeedback({ kind: "err", text: "Escribe la razón del rechazo." })
      return
    }
    setFeedback(null)
    startTransition(async () => {
      const res = await rejectPaymentAction(payment.id, reason.trim())
      if (res.ok) {
        setFeedback({ kind: "ok", text: "Pago rechazado." })
        setRejectOpen(false)
        setReason("")
        router.refresh()
      } else {
        setFeedback({ kind: "err", text: res.error })
      }
    })
  }

  const placedDate = formatDate(payment.orderPlacedAt)
  const proofDate = payment.proofUploadedAt
    ? formatRelative(payment.proofUploadedAt)
    : null

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/orders/${payment.orderId}`}
                className="text-sm font-semibold tracking-tight hover:text-primary"
              >
                #{payment.orderNumber}
              </Link>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase tracking-wider ring-1",
                  METHOD_TONE[payment.method],
                )}
              >
                {METHOD_LABEL[payment.method]}
              </Badge>
              <PaymentStatusPill status={payment.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              {payment.customerName ?? "(cliente sin perfil)"}
              {payment.customerPhone && (
                <>
                  {" · "}
                  <span className="tabular-nums">{payment.customerPhone}</span>
                </>
              )}
              {" · "}
              Pedido del {placedDate}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-display text-2xl tabular-nums">
              ${payment.amount.toFixed(2)}
            </span>
            {payment.amount !== payment.orderTotal && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                de ${payment.orderTotal.toFixed(2)} total
              </span>
            )}
          </div>
        </div>

        {/* Proof + meta */}
        <div className="flex flex-col gap-3 md:flex-row">
          {payment.proofUrl ? (
            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/proof relative block w-full max-w-[180px] overflow-hidden rounded-lg border bg-muted/40 ring-1 ring-border/40 transition-all hover:ring-primary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.proofUrl}
                alt="Comprobante"
                className="aspect-square w-full object-cover transition-transform group-hover/proof:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-1 text-[10px] font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/proof:opacity-100">
                <ExternalLink className="size-3" />
                Ver completo
              </span>
            </a>
          ) : payment.method === "cash_on_delivery" ? (
            <div className="grid w-full max-w-[180px] aspect-square place-items-center rounded-lg border-2 border-dashed border-border/60 bg-muted/20 px-3 text-center text-[11px] text-muted-foreground">
              Efectivo a la entrega — sin comprobante
            </div>
          ) : (
            <div className="grid w-full max-w-[180px] aspect-square place-items-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 px-3 text-center text-[11px] text-amber-900">
              Sin comprobante todavía
            </div>
          )}

          <div className="flex flex-1 flex-col gap-1.5 text-xs">
            {payment.transactionRef && (
              <Field
                label="Ref. transacción"
                value={
                  <span className="font-mono tabular-nums">
                    {payment.transactionRef}
                  </span>
                }
              />
            )}
            {proofDate && (
              <Field
                label="Subido"
                value={
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    {proofDate}
                  </span>
                }
              />
            )}
            {payment.verifiedAt && (
              <Field
                label="Verificado"
                value={formatDate(payment.verifiedAt)}
              />
            )}
            {payment.rejectionReason && (
              <Field
                label="Razón rechazo"
                value={
                  <span className="text-rose-700">
                    {payment.rejectionReason}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Actions */}
        {isPending && (
          <>
            {feedback && (
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-xs",
                  feedback.kind === "ok"
                    ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                    : "bg-rose-50 text-rose-900 ring-1 ring-rose-200",
                )}
                role="status"
              >
                {feedback.text}
              </div>
            )}

            {rejectOpen ? (
              <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50/40 p-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-rose-900">
                  Razón del rechazo
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Comprobante ilegible / monto no coincide / referencia inválida…"
                  rows={2}
                  className="resize-none text-sm"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRejectOpen(false)
                      setReason("")
                    }}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={pending || reason.trim().length === 0}
                  >
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    Rechazar pago
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleVerify}
                  disabled={pending}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Aprobar pago
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={pending}
                  className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                >
                  <XCircle className="size-3.5" />
                  Rechazar
                </Button>
                {payment.customerPhone && (
                  <a
                    href={`https://wa.me/${normalizePhone(payment.customerPhone)}?text=${encodeURIComponent(
                      `Hola, sobre tu pedido #${payment.orderNumber}…`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#0d6e3a] transition-colors hover:bg-[#25D366]/20"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {(isVerified || isRejected) && payment.customerPhone && (
          <div className="flex items-center justify-end gap-2">
            <a
              href={`tel:${payment.customerPhone}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Phone className="size-3.5" />
              {payment.customerPhone}
            </a>
            <a
              href={`https://wa.me/${normalizePhone(payment.customerPhone)}?text=${encodeURIComponent(
                `Hola, sobre tu pedido #${payment.orderNumber}…`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#0d6e3a] transition-colors hover:bg-[#25D366]/20"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  tone: "warning" | "success" | "destructive" | "neutral"
  active: boolean
  onClick: () => void
}) {
  const toneClass = {
    warning: "border-amber-200 bg-amber-50/50",
    success: "border-emerald-200 bg-emerald-50/50",
    destructive: "border-rose-200 bg-rose-50/50",
    neutral: "border-border bg-muted/20",
  }[tone]
  const activeClass = active ? "ring-2 ring-primary shadow-sm" : ""

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
        toneClass,
        activeClass,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-2xl tabular-nums">{value}</span>
    </button>
  )
}

function PaymentStatusPill({
  status,
}: {
  status: PaymentRecord["status"]
}) {
  const map = {
    proof_uploaded: {
      label: "Pendiente",
      icon: AlertCircle,
      className: "bg-amber-50 text-amber-900 ring-amber-200",
    },
    verified: {
      label: "Verificado",
      icon: Check,
      className: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    },
    failed: {
      label: "Rechazado",
      icon: XCircle,
      className: "bg-rose-50 text-rose-900 ring-rose-200",
    },
    unpaid: {
      label: "No pagado",
      icon: Wallet,
      className: "bg-muted/40 text-muted-foreground ring-border",
    },
    refunded: {
      label: "Devuelto",
      icon: Wallet,
      className: "bg-sky-50 text-sky-900 ring-sky-200",
    },
  } as const
  const cfg = map[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
        cfg.className,
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span>{value}</span>
    </div>
  )
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  if (days < 7) return `hace ${days} d`
  return formatDate(d)
}

function normalizePhone(p: string): string {
  return p.replace(/[^\d]/g, "")
}
