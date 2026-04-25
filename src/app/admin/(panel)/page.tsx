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
import { Separator } from "@/components/ui/separator"
import { StatCard } from "@/components/admin/stat-card"
import { SalesChart } from "@/components/admin/sales-chart"

const recentOrders = [
  {
    id: "M90-001247",
    customer: "Marta García",
    location: "Miami, USA → La Habana",
    total: "$140.00",
    method: "Zelle",
    status: "verified",
    time: "hace 4 min",
  },
  {
    id: "M90-001246",
    customer: "Roberto Pérez",
    location: "Vedado, La Habana",
    total: "$65.00",
    method: "Transfermóvil",
    status: "verified",
    time: "hace 18 min",
  },
  {
    id: "M90-001245",
    customer: "Liliana Cruz",
    location: "Madrid, ES → Matanzas",
    total: "$180.00",
    method: "PayPal",
    status: "proof_uploaded",
    time: "hace 42 min",
  },
  {
    id: "M90-001244",
    customer: "Yoel Domínguez",
    location: "Pinar del Río",
    total: "$55.00",
    method: "Cash on Delivery",
    status: "pending",
    time: "hace 1 h",
  },
] as const

const topProducts = [
  { name: "Lakers Bryant 96-97", sold: 24, revenue: "$1,560" },
  { name: "Bulls Jordan 95-96", sold: 19, revenue: "$1,235" },
  { name: "Heat LeBron 2014", sold: 14, revenue: "$910" },
  { name: "Real Madrid 2024", sold: 11, revenue: "$715" },
] as const

const statusVariant = {
  verified: { label: "Pagado", variant: "success" as const },
  proof_uploaded: { label: "Verificar pago", variant: "warning" as const },
  pending: { label: "Pendiente", variant: "secondary" as const },
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Welcome banner */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Hola Ever 👋 — esto es lo que pasó hoy
        </p>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Resumen de M90 Sports
        </h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label="Ventas hoy"
          value="$1,340"
          delta={{ value: "+18%", direction: "up", label: "vs ayer" }}
          icon={CircleDollarSign}
          accent="success"
        />
        <StatCard
          label="Pedidos"
          value="19"
          delta={{ value: "+4", direction: "up", label: "hoy" }}
          icon={ShoppingBag}
          accent="info"
        />
        <StatCard
          label="Pagos por verificar"
          value="2"
          delta={{ value: "Acción", direction: "flat", label: "Transfermóvil/Zelle" }}
          icon={Package2}
          accent="warning"
        />
        <StatCard
          label="Reseñas pendientes"
          value="3"
          delta={{ value: "Aprobar", direction: "flat", label: "moderación" }}
          icon={Star}
          accent="default"
        />
      </div>

      {/* Chart + top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Top productos</span>
              <Sparkles className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {topProducts.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.sold} vendidos
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {p.revenue}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
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
          {/* Desktop table */}
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
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-accent/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {o.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.location}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {o.total}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {o.method}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[o.status].variant}>
                        {statusVariant[o.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {o.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="divide-y md:hidden">
            {recentOrders.map((o) => (
              <li key={o.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-medium text-muted-foreground">
                      {o.id}
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {o.customer}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.location}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-base font-bold tabular-nums">
                      {o.total}
                    </span>
                    <Badge
                      variant={statusVariant[o.status].variant}
                      className="text-[10px]"
                    >
                      {statusVariant[o.status].label}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{o.method}</span>
                  <span>{o.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
