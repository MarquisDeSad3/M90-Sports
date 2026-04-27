import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Crown,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth"
import { isAtLeastStaff } from "@/lib/auth/roles"
import { getCustomerDetail } from "@/lib/queries/customers"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Sin pagar",
  proof_uploaded: "Verificando",
  verified: "Pagado",
  failed: "Rechazado",
  refunded: "Devuelto",
}

const PAYMENT_STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "destructive"
> = {
  unpaid: "neutral",
  proof_uploaded: "warning",
  verified: "success",
  failed: "destructive",
  refunded: "neutral",
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const acting = await requireAdmin()
  if (!isAtLeastStaff(acting.admin.role)) redirect("/admin")

  const { id } = await params
  const customer = await getCustomerDetail(id)
  if (!customer) notFound()

  const isVip = customer.totalSpent >= 100
  const phoneClean = customer.phone?.replace(/[^\d]/g, "") ?? ""

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials(customer.name)}
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              {customer.name}
            </h1>
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
                  Cuenta registrada
                </Badge>
              )}
              {customer.marketingConsent && (
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] border-purple-200 bg-purple-50 text-purple-900"
                >
                  Acepta marketing
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {customer.phone && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone className="size-3" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3" />
                  {customer.email}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground/70">
                Cliente desde {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {phoneClean && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Phone className="size-3.5" />
              Llamar
            </a>
            <a
              href={`https://wa.me/${phoneClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#25D366] px-3 text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Pedidos"
          value={`${customer.totalOrders}`}
          icon={ShoppingBag}
        />
        <StatTile
          label="Gastado"
          value={`$${customer.totalSpent.toFixed(2)}`}
        />
        <StatTile
          label="Último pedido"
          value={
            customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"
          }
        />
        <StatTile
          label="Promedio por pedido"
          value={
            customer.totalOrders > 0
              ? `$${(customer.totalSpent / customer.totalOrders).toFixed(2)}`
              : "—"
          }
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Orders list */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Historial de pedidos ({customer.orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customer.orders.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                Aún no ha hecho ningún pedido.
              </p>
            ) : (
              <ul className="divide-y">
                {customer.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold">
                          #{o.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                          <span>{formatDate(o.placedAt)}</span>
                          <span>·</span>
                          <span>
                            {ORDER_STATUS_LABEL[o.status] ?? o.status}
                          </span>
                          <PaymentTone
                            tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? "neutral"}
                            label={
                              PAYMENT_STATUS_LABEL[o.paymentStatus] ??
                              o.paymentStatus
                            }
                          />
                        </div>
                      </div>
                      <span className="font-display text-base tabular-nums">
                        ${o.total.toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Direcciones ({customer.addresses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin direcciones guardadas.
              </p>
            ) : (
              customer.addresses.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border bg-card p-3 text-xs",
                    a.isDefault &&
                      "border-primary/30 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold">{a.recipientName}</span>
                    </div>
                    {a.isDefault && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                        Default
                      </Badge>
                    )}
                  </div>
                  <span className="tabular-nums text-muted-foreground">
                    {a.phone}
                  </span>
                  <span className="text-foreground">
                    {[a.street, a.number].filter(Boolean).join(" ")}
                    {a.betweenStreets && ` (${a.betweenStreets})`}
                  </span>
                  <span className="text-muted-foreground">
                    {[a.neighborhood, a.municipality, a.province]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                  {a.reference && (
                    <span className="italic text-muted-foreground/80">
                      {a.reference}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground">
              {customer.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof ShoppingBag
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </div>
      <span className="font-display text-2xl tabular-nums">{value}</span>
    </div>
  )
}

function PaymentTone({
  tone,
  label,
}: {
  tone: "neutral" | "success" | "warning" | "destructive"
  label: string
}) {
  const cls = {
    neutral: "bg-muted/50 text-muted-foreground",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
    destructive: "bg-rose-100 text-rose-900",
  }[tone]
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {label}
    </span>
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
    year: "numeric",
  }).format(d)
}
