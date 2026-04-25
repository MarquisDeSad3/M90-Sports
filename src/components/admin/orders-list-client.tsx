"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import {
  ORDER_STATUS_LABEL,
  ORDER_SOURCE_LABEL,
  PAYMENT_METHOD_LABEL,
  timeAgo,
  type MockOrder,
  type OrderStatus,
} from "@/lib/mock-orders"

type StatusFilter = OrderStatus | "all" | "needs_action"

export interface OrdersListClientProps {
  orders: MockOrder[]
  counts: {
    pending: number
    verifyPayment: number
    preparing: number
    inTransit: number
    total: number
  }
}

export function OrdersListClient({ orders: initialOrders, counts }: OrdersListClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const stats = counts

  const filtered = React.useMemo(() => {
    return initialOrders
      .filter((o) => {
        if (statusFilter === "all") return true
        if (statusFilter === "needs_action") {
          return ["pending_confirmation", "payment_uploaded"].includes(o.status)
        }
        return o.status === statusFilter
      })
      .filter((o) => {
        if (!search) return true
        const q = search.toLowerCase()
        return [
          o.orderNumber,
          o.customerName,
          o.customerPhone,
          o.customerEmail ?? "",
          o.shippingAddress.recipientName,
          o.shippingAddress.municipality,
          o.shippingAddress.province,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => {
        const order: OrderStatus[] = [
          "pending_confirmation",
          "payment_uploaded",
          "confirmed",
          "paid",
          "preparing",
          "shipped",
          "delivered",
          "cancelled",
        ]
        const oa = order.indexOf(a.status)
        const ob = order.indexOf(b.status)
        if (oa !== ob) return oa - ob
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [search, statusFilter])

  const hasFilters = statusFilter !== "all" || search.length > 0
  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Pedidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Confirma pedidos del WhatsApp, verifica pagos y gestiona envíos.
          </p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/admin/orders/new">
            <Plus className="size-4" />
            <span>Pedido manual</span>
          </Link>
        </Button>
      </div>

      {/* Action stats — clickable */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionTile
          label="Por confirmar"
          value={stats.pending}
          icon={AlertCircle}
          tone="warning"
          active={statusFilter === "pending_confirmation"}
          onClick={() =>
            setStatusFilter(
              statusFilter === "pending_confirmation"
                ? "all"
                : "pending_confirmation"
            )
          }
          urgent={stats.pending > 0}
        />
        <ActionTile
          label="Verificar pago"
          value={stats.verifyPayment}
          icon={Wallet}
          tone="warning"
          active={statusFilter === "payment_uploaded"}
          onClick={() =>
            setStatusFilter(
              statusFilter === "payment_uploaded"
                ? "all"
                : "payment_uploaded"
            )
          }
          urgent={stats.verifyPayment > 0}
        />
        <ActionTile
          label="Preparando"
          value={stats.preparing}
          icon={ShoppingCart}
          tone="info"
        />
        <ActionTile
          label="En camino"
          value={stats.inTransit}
          icon={CheckCircle2}
          tone="info"
        />
      </div>

      {/* Filters bar */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 shadow-card md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente, teléfono o municipio..."
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 px-3">
                <Filter className="size-4" />
                Estado
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {statusFilter === "needs_action"
                      ? "Acción"
                      : ORDER_STATUS_LABEL[statusFilter]}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Todos los pedidos
                {statusFilter === "all" && (
                  <span className="ml-auto text-xs">●</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("needs_action")}
                className="text-amber-700"
              >
                ⚠ Requieren acción
                {statusFilter === "needs_action" && (
                  <span className="ml-auto text-xs">●</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(
                [
                  "pending_confirmation",
                  "confirmed",
                  "payment_uploaded",
                  "paid",
                  "preparing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ] as OrderStatus[]
              ).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setStatusFilter(s)}
                >
                  {ORDER_STATUS_LABEL[s]}
                  {statusFilter === s && (
                    <span className="ml-auto text-xs">●</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 gap-1 text-xs text-muted-foreground"
            >
              <X className="size-3.5" />
              Limpiar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="gap-3 p-12 text-center shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-0">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Sin pedidos</h3>
              <p className="text-xs text-muted-foreground">
                {hasFilters
                  ? "Prueba ajustar los filtros."
                  : "Aún no llegan pedidos. Comparte el catálogo en redes."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <Card className="hidden gap-0 overflow-hidden rounded-xl border-border/70 p-0 shadow-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Pago</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground">
                    Hace <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="w-8 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order) => {
                const isUrgent = ["pending_confirmation", "payment_uploaded"].includes(
                  order.status
                )
                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      isUrgent
                        ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.06]"
                        : "hover:bg-accent/40"
                    )}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={() =>
                        (window.location.href = `/admin/orders/${order.id}`)
                      }
                    >
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-foreground hover:text-primary"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">
                        {ORDER_SOURCE_LABEL[order.source]}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{order.customerName}</span>
                          {order.isDiaspora && (
                            <Badge
                              variant="outline"
                              className="h-4 border-sky-500/30 px-1 text-[9px] font-semibold text-sky-700 dark:text-sky-300"
                            >
                              {order.country}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="size-2.5" />
                          {order.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "producto" : "productos"}
                        </div>
                        <div className="line-clamp-1 max-w-[180px] text-[11px] text-muted-foreground">
                          {order.items[0]?.productName}
                          {order.items.length > 1 &&
                            ` +${order.items.length - 1} más`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      ${order.total.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">
                          {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                        </span>
                        {order.proofUploaded && !order.paymentVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            <span className="size-1 rounded-full bg-amber-500" />
                            Comprobante listo
                          </span>
                        )}
                        {order.paymentVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="size-2.5" />
                            Verificado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-muted-foreground tabular-nums">
                      {timeAgo(order.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {filtered.map((order) => {
            const isUrgent = ["pending_confirmation", "payment_uploaded"].includes(
              order.status
            )
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block"
              >
                <Card
                  className={cn(
                    "gap-3 rounded-xl border-border/70 bg-card p-3 shadow-card transition-all active:scale-[0.99]",
                    isUrgent && "border-amber-500/30"
                  )}
                >
                  <CardContent className="flex flex-col gap-2.5 p-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">
                            {order.customerName}
                          </span>
                          {order.isDiaspora && (
                            <Badge
                              variant="outline"
                              className="h-4 border-sky-500/30 px-1 text-[9px] font-semibold text-sky-700 dark:text-sky-300"
                            >
                              {order.country}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-bold tabular-nums">
                          ${order.total.toFixed(0)}
                        </span>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-2.5" />
                        {order.customerPhone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-2.5" />
                        {order.shippingAddress.municipality}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-[11px]">
                      <span className="text-muted-foreground">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "producto" : "productos"} ·{" "}
                        {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mostrando{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {filtered.length}
            </span>{" "}
            de{" "}
            <span className="tabular-nums">{counts.total}</span> pedidos
          </span>
        </div>
      )}
    </div>
  )
}

function ActionTile({
  label,
  value,
  icon: Icon,
  tone = "default",
  active,
  onClick,
  urgent,
}: {
  label: string
  value: number
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "success" | "warning" | "info" | "destructive"
  active?: boolean
  onClick?: () => void
  urgent?: boolean
}) {
  const toneStyle = {
    default: "text-primary bg-primary/8 ring-primary/15",
    success:
      "text-emerald-700 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-300",
    warning:
      "text-amber-700 bg-amber-500/12 ring-amber-500/20 dark:text-amber-300",
    info: "text-sky-700 bg-sky-500/10 ring-sky-500/15 dark:text-sky-300",
    destructive:
      "text-rose-700 bg-rose-500/10 ring-rose-500/15 dark:text-rose-300",
  }[tone]

  const content = (
    <Card
      className={cn(
        "group relative gap-1.5 rounded-xl border-border/70 p-4 shadow-card transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
        active &&
          "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
        urgent && !active && tone === "warning" && "border-amber-500/30"
      )}
    >
      <CardContent className="flex flex-col gap-1.5 p-0">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          {Icon && (
            <div
              className={cn(
                "grid size-7 place-items-center rounded-md ring-1 ring-inset",
                toneStyle
              )}
            >
              <Icon className="size-3.5" />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="font-display text-2xl tracking-tight tabular-nums leading-none">
            {value}
          </div>
          {urgent && value > 0 && (
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Acción
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left">
        {content}
      </button>
    )
  }
  return content
}
