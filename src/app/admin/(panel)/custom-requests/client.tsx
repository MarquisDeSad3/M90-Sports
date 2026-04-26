"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  quoteCustomRequestAction,
  saveAdminNotesAction,
  setCustomRequestStatusAction,
  type ActionResult,
} from "./actions"
import type {
  CustomRequest,
  CustomRequestStatus,
} from "@/lib/queries/custom-requests"

const initialState: ActionResult = { ok: false, error: "" }

const STATUS_LABEL: Record<CustomRequestStatus, string> = {
  pending: "Pendiente",
  quoted: "Cotizado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  converted: "Convertido en pedido",
}
const STATUS_VARIANT: Record<
  CustomRequestStatus,
  "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  pending: "warning",
  quoted: "info",
  accepted: "success",
  rejected: "destructive",
  converted: "secondary",
}

interface Counts {
  total: number
  pending: number
  quoted: number
  accepted: number
  rejected: number
  converted: number
}

export function CustomRequestsClient({
  initial,
  counts,
}: {
  initial: CustomRequest[]
  counts: Counts
}) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    CustomRequestStatus | "all"
  >("all")

  const filtered = React.useMemo(() => {
    return initial.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (
          ![r.customerName, r.customerPhone, r.customerEmail ?? "", r.requestText]
            .join(" ")
            .toLowerCase()
            .includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [initial, search, statusFilter])

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles — clickable filters */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile
          label="Todos"
          value={counts.total}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <StatTile
          label="Pendientes"
          value={counts.pending}
          tone="warning"
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
        />
        <StatTile
          label="Cotizados"
          value={counts.quoted}
          tone="info"
          active={statusFilter === "quoted"}
          onClick={() => setStatusFilter("quoted")}
        />
        <StatTile
          label="Aceptados"
          value={counts.accepted}
          tone="success"
          active={statusFilter === "accepted"}
          onClick={() => setStatusFilter("accepted")}
        />
        <StatTile
          label="Rechazados"
          value={counts.rejected}
          tone="destructive"
          active={statusFilter === "rejected"}
          onClick={() => setStatusFilter("rejected")}
        />
      </div>

      {/* Search */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono, email o descripción…"
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Sparkles className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {initial.length === 0
                ? "Aún no hay solicitudes. Llegarán cuando un cliente pregunte por algo que no está en el catálogo."
                : "Sin resultados con esos filtros."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({ request }: { request: CustomRequest }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {request.customerName}
              </span>
              <Badge variant={STATUS_VARIANT[request.status]} className="text-[10px]">
                {STATUS_LABEL[request.status]}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {request.customerPhone}
              {request.customerEmail ? ` · ${request.customerEmail}` : ""} ·{" "}
              {request.createdAt.toLocaleString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(!open)}
          >
            {open ? "Cerrar" : "Detalle"}
          </Button>
        </div>

        {/* Request text */}
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed">
          {request.requestText}
        </p>

        {(request.referenceLinks?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {request.referenceLinks!.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 hover:border-primary/40 hover:text-primary"
              >
                <ExternalLink className="size-3" /> Referencia
              </a>
            ))}
          </div>
        )}

        {request.quotedPrice !== null && (
          <div className="flex items-center gap-3 rounded-md border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Cotización:</span>
            <span className="font-display text-lg tabular-nums">
              ${request.quotedPrice.toFixed(0)}
            </span>
            {request.quoteNotes && (
              <span className="text-xs text-muted-foreground">
                · {request.quoteNotes}
              </span>
            )}
          </div>
        )}

        {open && <DetailPanel request={request} />}
      </CardContent>
    </Card>
  )
}

function DetailPanel({ request }: { request: CustomRequest }) {
  return (
    <div className="flex flex-col gap-4 border-t pt-3">
      <QuoteForm request={request} />
      <NotesForm request={request} />
      <ActionButtons request={request} />
    </div>
  )
}

function QuoteForm({ request }: { request: CustomRequest }) {
  const [state, action, pending] = useActionState(
    quoteCustomRequestAction,
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={request.id} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Precio (USD)
          </Label>
          <Input
            name="quotedPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={request.quotedPrice ?? ""}
            placeholder="35"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nota para el cliente (opcional)
          </Label>
          <Input
            name="quoteNotes"
            defaultValue={request.quoteNotes ?? ""}
            maxLength={500}
            placeholder="Llegada estimada 20 días, incluye envío"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} size="sm" className="gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Guardar cotización
        </Button>
        <WhatsAppButton request={request} />
        {state.ok ? (
          <span className="text-xs text-emerald-600">Guardado.</span>
        ) : (
          state.error && (
            <span className="text-xs text-rose-600">{state.error}</span>
          )
        )}
      </div>
    </form>
  )
}

function WhatsAppButton({ request }: { request: CustomRequest }) {
  const phone = request.customerPhone.replace(/[^\d]/g, "")
  const lines: string[] = [
    `Hola ${request.customerName.split(" ")[0]}, gracias por escribirnos.`,
  ]
  if (request.quotedPrice !== null) {
    lines.push(`Tu pedido sale en $${request.quotedPrice.toFixed(0)}.`)
  }
  if (request.quoteNotes) {
    lines.push(request.quoteNotes)
  }
  lines.push("¿Confirmamos?")
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n\n"))}`
  return (
    <Button type="button" asChild variant="outline" size="sm" className="gap-2">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" /> Responder por WhatsApp
      </a>
    </Button>
  )
}

function NotesForm({ request }: { request: CustomRequest }) {
  const [state, action, pending] = useActionState(
    saveAdminNotesAction,
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={request.id} />
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        Notas internas
      </Label>
      <Input
        name="adminNotes"
        defaultValue={request.adminNotes ?? ""}
        maxLength={1000}
        placeholder="Visible solo para el equipo"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} variant="outline" size="sm">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Guardar nota"}
        </Button>
        {state.ok && (
          <span className="text-xs text-emerald-600">Nota guardada.</span>
        )}
      </div>
    </form>
  )
}

function ActionButtons({ request }: { request: CustomRequest }) {
  const [busy, setBusy] = React.useState(false)
  async function go(status: "accepted" | "rejected" | "converted") {
    setBusy(true)
    await setCustomRequestStatusAction(request.id, status)
    setBusy(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {request.status !== "accepted" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => go("accepted")}
          className="gap-1.5 text-emerald-700 hover:bg-emerald-500/10"
        >
          <Check className="size-3.5" /> Marcar aceptado
        </Button>
      )}
      {request.status !== "rejected" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => go("rejected")}
          className="gap-1.5 text-rose-600 hover:bg-rose-500/10"
        >
          <XCircle className="size-3.5" /> Rechazar
        </Button>
      )}
      {request.status !== "converted" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => go("converted")}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" /> Marcar convertido
        </Button>
      )}
    </div>
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
  tone?: "warning" | "info" | "success" | "destructive"
  active?: boolean
  onClick?: () => void
}) {
  const toneClass = !value
    ? "text-muted-foreground/60"
    : tone === "warning"
      ? "text-amber-700 dark:text-amber-300"
      : tone === "info"
        ? "text-sky-700 dark:text-sky-300"
        : tone === "success"
          ? "text-emerald-700 dark:text-emerald-300"
          : tone === "destructive"
            ? "text-rose-700 dark:text-rose-300"
            : "text-foreground"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 ${active ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`font-display text-2xl tabular-nums ${toneClass}`}>
        {value}
      </span>
    </button>
  )
}
