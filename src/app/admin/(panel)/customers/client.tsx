"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Crown,
  Globe2,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  CustomerCounts,
  CustomerRecord,
  CustomerSegment,
} from "@/lib/queries/customers"

interface Props {
  items: CustomerRecord[]
  counts: CustomerCounts
  segment: CustomerSegment
}

export function CustomersClient({ items, counts, segment }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter((c) =>
      [c.name, c.phone ?? "", c.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [items, search])

  function setSegment(next: CustomerSegment) {
    const params = new URLSearchParams(searchParams)
    if (next === "all") params.delete("segment")
    else params.set("segment", next)
    const qs = params.toString()
    router.push(`/admin/customers${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SegmentTile
          icon={Users}
          label="Total"
          value={counts.total}
          tone="neutral"
          active={segment === "all"}
          onClick={() => setSegment("all")}
        />
        <SegmentTile
          icon={Globe2}
          label="Diáspora"
          value={counts.diaspora}
          tone="info"
          active={segment === "diaspora"}
          onClick={() => setSegment("diaspora")}
        />
        <SegmentTile
          icon={Sparkles}
          label="En Cuba"
          value={counts.cuba}
          tone="success"
          active={segment === "cuba"}
          onClick={() => setSegment("cuba")}
        />
        <SegmentTile
          icon={Crown}
          label="VIP"
          value={counts.vip}
          tone="warning"
          active={segment === "vip"}
          onClick={() => setSegment("vip")}
          subtitle="$100+ gastado"
        />
        <SegmentTile
          icon={Snowflake}
          label="Inactivos"
          value={null}
          tone="muted"
          active={segment === "lapsed"}
          onClick={() => setSegment("lapsed")}
          subtitle="+90 días"
        />
      </div>

      {/* Search */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre, teléfono o email…"
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
            {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="size-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search
                ? `Sin resultados para "${search}"`
                : "Sin clientes en este segmento."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Contacto</th>
                <th className="px-3 py-2.5 text-right">Pedidos</th>
                <th className="px-3 py-2.5 text-right">Gastado</th>
                <th className="px-3 py-2.5">Último</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <CustomerRow key={c.id} customer={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CustomerRow({ customer }: { customer: CustomerRecord }) {
  const isVip = customer.totalSpent >= 100

  return (
    <tr className="transition-colors hover:bg-muted/20">
      <td className="px-3 py-3">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="flex items-start gap-2 hover:text-primary"
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(customer.name)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold tracking-tight">
              {customer.name}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {customer.isDiaspora ? (
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-blue-200 bg-blue-50 text-[10px] text-blue-900"
                >
                  <Globe2 className="size-2.5" />
                  Diáspora
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-900"
                >
                  Cuba
                </Badge>
              )}
              {isVip && (
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-900"
                >
                  <Crown className="size-2.5" />
                  VIP
                </Badge>
              )}
              {customer.hasAccount && (
                <Badge variant="secondary" className="h-5 text-[10px]">
                  Cuenta
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          {customer.phone && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Phone className="size-3" />
              {customer.phone}
            </span>
          )}
          {customer.email && (
            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
              <Mail className="size-3" />
              {customer.email}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <span className="inline-flex items-center gap-1 text-sm font-semibold">
          <ShoppingBag className="size-3 text-muted-foreground" />
          {customer.totalOrders}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="font-display text-base tabular-nums">
          ${customer.totalSpent.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
        {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          {customer.phone && (
            <a
              href={`https://wa.me/${normalizePhone(customer.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir WhatsApp"
              className="grid size-8 place-items-center rounded-md text-[#0d6e3a] transition-colors hover:bg-[#25D366]/10"
            >
              <MessageCircle className="size-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  )
}

function SegmentTile({
  icon: Icon,
  label,
  value,
  tone,
  active,
  onClick,
  subtitle,
}: {
  icon: typeof Users
  label: string
  value: number | null
  tone: "neutral" | "info" | "success" | "warning" | "muted"
  active: boolean
  onClick: () => void
  subtitle?: string
}) {
  const toneClass = {
    neutral: "border-border bg-card",
    info: "border-blue-200 bg-blue-50/50",
    success: "border-emerald-200 bg-emerald-50/50",
    warning: "border-amber-200 bg-amber-50/50",
    muted: "border-muted-foreground/20 bg-muted/30",
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
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <span className="font-display text-2xl tabular-nums">
        {value === null ? "—" : value}
      </span>
      {subtitle && (
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      )}
    </button>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(d)
}

function normalizePhone(p: string): string {
  return p.replace(/[^\d]/g, "")
}
