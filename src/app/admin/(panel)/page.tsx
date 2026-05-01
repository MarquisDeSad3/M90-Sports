import Link from "next/link"
import {
  ArrowRight,
  CircleDollarSign,
  Package2,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/admin/stat-card"
import { SalesChart } from "@/components/admin/sales-chart"
import { getDashboardData } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

const ES_DAY_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const PAYMENT_STATUS_LABEL: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  unpaid: { label: "Pendiente", variant: "secondary" },
  proof_uploaded: { label: "Verificar pago", variant: "warning" },
  verified: { label: "Pagado", variant: "success" },
  failed: { label: "Falló", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash_on_delivery: "Efectivo a la entrega",
  zelle: "Zelle",
  paypal: "PayPal",
}

function formatMoney(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

/** Compact "hace X" label for recent orders. */
function timeAgo(d: Date) {
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  return `hace ${days} d`
}

/** Build a 7-slot series so the chart always shows the full week, even
 * if some days have no sales (the query only returns days with rows). */
function buildSevenDaySeries(
  rows: Array<{ day: string; revenue: number }>,
): Array<{ day: string; sales: number }> {
  const map = new Map(rows.map((r) => [r.day, r.revenue]))
  const result: Array<{ day: string; sales: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({
      day: ES_DAY_LABEL[d.getDay()] ?? "—",
      sales: map.get(key) ?? 0,
    })
  }
  return result
}

function deltaLabel(today: number, yesterday: number, suffix = ""): {
  value: string
  direction: "up" | "down" | "flat"
} {
  if (yesterday === 0) {
    return today > 0
      ? { value: "+nuevo", direction: "up" }
      : { value: "—", direction: "flat" }
  }
  const pct = Math.round(((today - yesterday) / yesterday) * 100)
  if (pct === 0) return { value: `0%${suffix}`, direction: "flat" }
  return {
    value: `${pct > 0 ? "+" : ""}${pct}%${suffix}`,
    direction: pct > 0 ? "up" : "down",
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()

  const salesDelta = deltaLabel(data.salesToday, data.salesYesterday)
  const ordersDelta = deltaLabel(data.ordersToday, data.ordersYesterday)
  const weekTotal = data.salesByDay.reduce((s, d) => s + d.revenue, 0)
  const chartData = buildSevenDaySeries(data.salesByDay)

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Hola Ever 👋 — esto es lo que pasó hoy
        </p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Resumen de M90 Sports
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label="Ventas hoy"
          value={formatMoney(data.salesToday)}
          delta={{ ...salesDelta, label: "vs ayer" }}
          icon={CircleDollarSign}
          accent="success"
        />
        <StatCard
          label="Pedidos hoy"
          value={String(data.ordersToday)}
          delta={{ ...ordersDelta, label: "vs ayer" }}
          icon={ShoppingBag}
          accent="info"
        />
        <StatCard
          label="Pagos por verificar"
          value={String(data.paymentsToVerify)}
          delta={{
            value: data.paymentsToVerify > 0 ? "Acción" : "OK",
            direction: data.paymentsToVerify > 0 ? "flat" : "up",
            label: "Zelle/PayPal",
          }}
          icon={Package2}
          accent="warning"
        />
        <StatCard
          label="Reseñas pendientes"
          value={String(data.reviewsPending)}
          delta={{
            value: data.reviewsPending > 0 ? "Aprobar" : "OK",
            direction: data.reviewsPending > 0 ? "flat" : "up",
            label: "moderación",
          }}
          icon={Star}
          accent="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart
            data={chartData}
            weekTotal={weekTotal}
            weekDeltaLabel={`${data.ordersToday + data.ordersYesterday} pedidos esta semana`}
          />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Top productos</span>
              <Sparkles className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topProducts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aún no hay ventas registradas.
              </p>
            ) : (
              <ul className="divide-y">
                {data.topProducts.map((p, i) => (
                  <li
                    key={p.name + i}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.sold} vendido{p.sold === 1 ? "" : "s"}
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base">Pedidos recientes</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
            <Link href="/admin/orders">
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay pedidos todavía.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Pedido</th>
                      <th className="px-4 py-2 text-left font-medium">Cliente</th>
                      <th className="px-4 py-2 text-left font-medium">Total</th>
                      <th className="px-4 py-2 text-left font-medium">Método</th>
                      <th className="px-4 py-2 text-left font-medium">Estado</th>
                      <th className="px-4 py-2 text-right font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recentOrders.map((o) => {
                      const status =
                        PAYMENT_STATUS_LABEL[o.paymentStatus] ??
                        PAYMENT_STATUS_LABEL.unpaid!
                      return (
                        <tr
                          key={o.id}
                          className="transition-colors hover:bg-accent/40"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="hover:underline"
                            >
                              {o.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {o.customerName ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {o.locationLabel}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums">
                            {formatMoney(o.total)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {o.paymentMethod
                              ? PAYMENT_METHOD_LABEL[o.paymentMethod] ??
                                o.paymentMethod
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {timeAgo(o.placedAt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y md:hidden">
                {data.recentOrders.map((o) => {
                  const status =
                    PAYMENT_STATUS_LABEL[o.paymentStatus] ??
                    PAYMENT_STATUS_LABEL.unpaid!
                  return (
                    <li key={o.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs font-medium text-muted-foreground">
                            {o.orderNumber}
                          </div>
                          <div className="truncate text-sm font-semibold">
                            {o.customerName ?? "—"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {o.locationLabel}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-base font-bold tabular-nums">
                            {formatMoney(o.total)}
                          </span>
                          <Badge
                            variant={status.variant}
                            className="text-[10px]"
                          >
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {o.paymentMethod
                            ? PAYMENT_METHOD_LABEL[o.paymentMethod] ??
                              o.paymentMethod
                            : "—"}
                        </span>
                        <span>{timeAgo(o.placedAt)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
