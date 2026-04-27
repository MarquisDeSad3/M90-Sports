import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Truck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import { getPublicOrder } from "@/lib/queries/public-order"
import { cn } from "@/lib/utils"
import type {
  PublicFulfillmentStatus,
  PublicOrderStatus,
  PublicPaymentStatus,
  PublicPaymentMethod,
} from "@/lib/queries/public-order"

export const dynamic = "force-dynamic"
export const revalidate = 0

const M90_NAVY = "#011b53"

interface PageProps {
  params: Promise<{ orderNumber: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Pedido ${orderNumber} · M90 Sports`,
    description:
      "Sigue el estado de tu pedido — pago, preparación y entrega.",
    robots: { index: false, follow: false },
  }
}

const PAYMENT_METHOD_LABEL: Record<PublicPaymentMethod, string> = {
  transfermovil: "Transfermóvil",
  cash_on_delivery: "Efectivo a la entrega",
  zelle: "Zelle",
  paypal: "PayPal",
}

export default async function PublicOrderPage({ params }: PageProps) {
  const { orderNumber } = await params
  const order = await getPublicOrder(orderNumber)
  if (!order) notFound()

  const needsProof =
    order.paymentStatus === "unpaid" &&
    order.paymentMethod !== "cash_on_delivery" &&
    order.status !== "cancelled"

  const lastPayment = order.payments[order.payments.length - 1] ?? null
  const wasRejected = lastPayment?.status === "failed"

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      <section className="mx-auto max-w-3xl px-5 pt-28 pb-10 md:px-8 md:pt-32">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/65 transition-colors hover:text-[#011b53]"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)] md:p-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#980e21]">
              Pedido
            </span>
            <h1
              className="font-display text-3xl leading-tight tracking-tight md:text-4xl"
              style={{ color: M90_NAVY }}
            >
              #{order.orderNumber}
            </h1>
            <p className="text-xs text-[#011b53]/65">
              Hecho el {formatDateTime(order.placedAt)}
            </p>
          </div>

          <StatusTimeline order={order} />
        </div>

        {/* Pay action */}
        {needsProof && (
          <div
            className={cn(
              "mt-4 flex flex-col gap-2 rounded-2xl p-5 md:p-6",
              wasRejected
                ? "bg-rose-50 ring-1 ring-rose-200"
                : "bg-amber-50 ring-1 ring-amber-200",
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  wasRejected ? "text-rose-700" : "text-amber-700",
                )}
              />
              <div className="flex flex-col gap-0.5">
                <h2
                  className={cn(
                    "text-sm font-semibold",
                    wasRejected ? "text-rose-900" : "text-amber-900",
                  )}
                >
                  {wasRejected
                    ? "Comprobante anterior rechazado"
                    : "Falta el comprobante de pago"}
                </h2>
                <p
                  className={cn(
                    "text-xs",
                    wasRejected ? "text-rose-800" : "text-amber-800",
                  )}
                >
                  {wasRejected && lastPayment?.rejectionReason
                    ? `Razón: ${lastPayment.rejectionReason}. Sube uno nuevo.`
                    : "Para reservar tus jerseys necesitamos confirmar el pago."}
                </p>
              </div>
            </div>
            <Link
              href={`/pedido/${order.orderNumber}/pagar`}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-sm font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
            >
              <Upload className="size-4" />
              Subir comprobante
            </Link>
          </div>
        )}

        {/* Items */}
        <div className="mt-4 rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)] md:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Artículos
          </h2>
          <ul className="mt-3 divide-y divide-[rgba(1,27,83,0.08)]">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="size-14 shrink-0 rounded-lg bg-[rgba(1,27,83,0.05)] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-[rgba(1,27,83,0.05)]">
                    <Package className="size-5 text-[#011b53]/40" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-[#011b53] line-clamp-2">
                    {item.productName}
                  </span>
                  <span className="text-[11px] text-[#011b53]/55 tabular-nums">
                    {item.variantSize ? `Talla ${item.variantSize} · ` : ""}
                    Cant. {item.quantity}
                  </span>
                </div>
                <span className="font-display text-base text-[#011b53] tabular-nums">
                  ${item.subtotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-1 border-t border-[rgba(1,27,83,0.08)] pt-3 text-sm">
            <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
            {order.shippingCost > 0 && (
              <Row label="Envío" value={`$${order.shippingCost.toFixed(2)}`} />
            )}
            {order.discountTotal > 0 && (
              <Row
                label="Descuento"
                value={`-$${order.discountTotal.toFixed(2)}`}
                tone="success"
              />
            )}
            <Row
              label="Total"
              value={`$${order.total.toFixed(2)} ${order.currency}`}
              bold
            />
            {order.depositAmount !== null && (
              <>
                <Row
                  label="Reserva (30%)"
                  value={`$${order.depositAmount.toFixed(2)}`}
                  hint={
                    order.paidAt
                      ? "✓ Pagado"
                      : "Debes esto ahora para reservar"
                  }
                />
                {order.balanceAmount !== null && (
                  <Row
                    label="Saldo a la entrega"
                    value={`$${order.balanceAmount.toFixed(2)}`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Shipping address */}
        {order.shipping && (
          <div className="mt-4 rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)] md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
              Entrega
            </h2>
            <div className="mt-2 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#011b53]/55" />
              <div className="flex flex-col gap-0.5">
                {order.shipping.recipientName && (
                  <span className="font-semibold">
                    {order.shipping.recipientName}
                  </span>
                )}
                {order.shipping.recipientPhone && (
                  <span className="text-[12px] text-[#011b53]/65 tabular-nums">
                    {order.shipping.recipientPhone}
                  </span>
                )}
                {order.shipping.street && (
                  <span className="text-[13px] text-[#011b53]/80">
                    {order.shipping.street}
                  </span>
                )}
                <span className="text-[13px] text-[#011b53]/80">
                  {[order.shipping.municipality, order.shipping.province]
                    .filter(Boolean)
                    .join(", ")}
                </span>
                {order.shipping.reference && (
                  <span className="text-[12px] italic text-[#011b53]/55">
                    {order.shipping.reference}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment summary */}
        {order.paymentMethod && (
          <div className="mt-4 rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)] md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
              Pago
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Wallet className="size-4 text-[#011b53]/55" />
              <span className="font-semibold">
                {PAYMENT_METHOD_LABEL[order.paymentMethod]}
              </span>
              <PaymentBadge status={order.paymentStatus} />
            </div>
            {order.payments.length > 0 && (
              <ul className="mt-3 divide-y divide-[rgba(1,27,83,0.08)] text-xs">
                {order.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2 first:pt-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#011b53]/75 tabular-nums">
                        ${p.amount.toFixed(2)}
                        {p.transactionRef && (
                          <>
                            {" · "}
                            <span className="font-mono">{p.transactionRef}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-[#011b53]/55">
                        {p.proofUploadedAt
                          ? `Subido ${formatDateTime(p.proofUploadedAt)}`
                          : `Creado ${formatDateTime(p.createdAt)}`}
                      </span>
                      {p.rejectionReason && (
                        <span className="text-[11px] text-rose-700">
                          Rechazado: {p.rejectionReason}
                        </span>
                      )}
                    </div>
                    <PaymentBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Help footer */}
        <div className="mt-4 rounded-2xl bg-[#011b53] p-5 text-[#efd9a3] md:p-6">
          <h3 className="font-display text-lg">¿Necesitas ayuda?</h3>
          <p className="mt-1 text-xs text-[#efd9a3]/80">
            Escríbenos por WhatsApp con el número de tu pedido y te
            respondemos rápido.
          </p>
          <a
            href={`https://wa.me/5351191461?text=${encodeURIComponent(
              `Hola M90, tengo una pregunta sobre el pedido #${order.orderNumber}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="size-4" />
            WhatsApp M90
          </a>
        </div>
      </section>

      <WhatsappFloat />
    </main>
  )
}

function Row({
  label,
  value,
  bold = false,
  tone,
  hint,
}: {
  label: string
  value: string
  bold?: boolean
  tone?: "success" | "warning"
  hint?: string
}) {
  const valueColor =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-800"
        : ""
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-[12px]",
          bold ? "font-semibold uppercase tracking-wider" : "text-[#011b53]/65",
        )}
      >
        {label}
        {hint && (
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-[#011b53]/55">
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-display text-lg" : "text-sm",
          valueColor,
        )}
      >
        {value}
      </span>
    </div>
  )
}

function StatusTimeline({
  order,
}: {
  order: { status: PublicOrderStatus; paymentStatus: PublicPaymentStatus; fulfillmentStatus: PublicFulfillmentStatus; placedAt: Date; paidAt: Date | null; shippedAt: Date | null; deliveredAt: Date | null; cancelledAt: Date | null; cancelledReason: string | null }
}) {
  if (order.status === "cancelled") {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
          <XCircle className="size-4" />
          Pedido cancelado
        </div>
        {order.cancelledReason && (
          <p className="text-xs text-rose-800">{order.cancelledReason}</p>
        )}
      </div>
    )
  }

  const steps = [
    {
      label: "Pedido recibido",
      done: true,
      at: order.placedAt,
      icon: Check,
    },
    {
      label: "Pago verificado",
      done: order.paymentStatus === "verified",
      at: order.paidAt,
      icon: Wallet,
    },
    {
      label: "Preparando envío",
      done:
        order.fulfillmentStatus === "preparing" ||
        order.fulfillmentStatus === "shipped" ||
        order.fulfillmentStatus === "delivered",
      at: null,
      icon: Package,
    },
    {
      label: "Enviado",
      done: order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered",
      at: order.shippedAt,
      icon: Truck,
    },
    {
      label: "Entregado",
      done: order.fulfillmentStatus === "delivered",
      at: order.deliveredAt,
      icon: Check,
    },
  ]

  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((step, idx) => {
        const isPast = step.done
        const isCurrent =
          !step.done && (idx === 0 || steps[idx - 1]!.done)
        const StepIcon = step.icon
        return (
          <li key={step.label} className="flex items-start gap-2.5">
            <div
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
                isPast
                  ? "bg-emerald-600 text-white"
                  : isCurrent
                    ? "bg-[#980e21] text-white"
                    : "bg-[rgba(1,27,83,0.1)] text-[#011b53]/40",
              )}
            >
              {isPast ? (
                <Check className="size-3.5" />
              ) : isCurrent ? (
                <Clock className="size-3.5 animate-pulse" />
              ) : (
                <StepIcon className="size-3.5" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span
                className={cn(
                  "text-sm",
                  isPast || isCurrent
                    ? "font-semibold text-[#011b53]"
                    : "text-[#011b53]/45",
                )}
              >
                {step.label}
              </span>
              {step.at && (
                <span className="text-[11px] text-[#011b53]/55 tabular-nums">
                  {formatDateTime(step.at)}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PaymentBadge({ status }: { status: PublicPaymentStatus }) {
  const map = {
    unpaid: { label: "Sin pagar", className: "bg-muted/50 text-[#011b53]/55" },
    proof_uploaded: {
      label: "Verificando",
      className: "bg-amber-100 text-amber-900",
    },
    verified: {
      label: "Verificado",
      className: "bg-emerald-100 text-emerald-900",
    },
    failed: {
      label: "Rechazado",
      className: "bg-rose-100 text-rose-900",
    },
    refunded: {
      label: "Devuelto",
      className: "bg-sky-100 text-sky-900",
    },
  } as const
  const cfg = map[status]
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  )
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

