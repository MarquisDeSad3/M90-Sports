"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { MockOrder } from "@/lib/mock-orders"
import {
  approvePayment,
  cancelOrder,
  confirmOrder,
  markDelivered,
  markPaidCoD,
  markPreparing,
  markShipped,
  rejectPayment,
} from "@/app/admin/(panel)/orders/actions"

interface OrderActionsProps {
  order: MockOrder
}

type ServerAction = (id: string) => Promise<{ ok: true } | { ok: false; error: string }>

/**
 * Action panel for the order detail page. Drives the next-step UI off
 * the three real schema columns:
 *   - status:             pending → confirmed → shipped → delivered
 *   - paymentStatus:      unpaid → proof_uploaded → verified
 *   - fulfillmentStatus:  unfulfilled → preparing → shipped → delivered
 *
 * The schema separates status/payment/fulfillment so an order can be
 * "confirmed" while waiting for payment, then "confirmed + verified"
 * while preparing, etc. This component reads all three to decide what
 * the next action should be.
 */
export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function run(
    action: ServerAction,
    successMsg: string,
    description?: string,
  ) {
    setLoading(true)
    const result = await action(order.id)
    setLoading(false)
    if (!result.ok) {
      toast.error("No se pudo completar la acción", {
        description: result.error,
      })
      return
    }
    toast.success(successMsg, description ? { description } : undefined)
    router.refresh()
  }

  // Terminal states first.
  if (order.status === "delivered") {
    return (
      <Banner
        tone="success"
        title="Pedido entregado"
        body="El pedido ya llegó al cliente."
      />
    )
  }
  if (order.status === "cancelled") {
    return (
      <Banner
        tone="destructive"
        title="Pedido cancelado"
        body={order.cancelReason}
      />
    )
  }
  if (order.status === "refunded") {
    return (
      <Banner
        tone="destructive"
        title="Pedido reembolsado"
        body="Devolución completada."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Step 1 — pending: needs Ever's confirmation */}
      {order.status === "pending" && (
        <>
          <Banner
            tone="warning"
            title="Acción requerida"
            body="Habla con el cliente por WhatsApp y confirma el pedido cuando esté todo OK."
          />
          <Button
            type="button"
            disabled={loading}
            className="gap-2"
            onClick={() =>
              run(
                confirmOrder,
                "Pedido confirmado",
                "Avisa al cliente para que proceda con el pago.",
              )
            }
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Confirmar pedido
          </Button>
        </>
      )}

      {/* Step 2 — confirmed: depends on payment */}
      {order.status === "confirmed" &&
        (order.paymentStatus ?? "unpaid") === "unpaid" && (
          <>
            {order.paymentMethod === "cash_on_delivery" ? (
              <>
                <Banner
                  tone="info"
                  title="Efectivo a la entrega"
                  body="Cuando el mensajero entregue y reciba el pago, márcalo aquí."
                />
                <Button
                  type="button"
                  disabled={loading}
                  className="gap-2"
                  onClick={() =>
                    run(
                      markPaidCoD,
                      "Marcado como pagado",
                      "Pedido pasa a preparación.",
                    )
                  }
                >
                  <Wallet className="size-4" />
                  Marcar como pagado
                </Button>
              </>
            ) : (
              <Banner
                tone="info"
                title="Esperando comprobante"
                body={`El cliente debe pagar por ${
                  order.paymentMethod === "transfermovil"
                    ? "Transfermóvil"
                    : order.paymentMethod === "zelle"
                      ? "Zelle"
                      : order.paymentMethod === "paypal"
                        ? "PayPal"
                        : order.paymentMethod
                } y enviarte el comprobante.`}
              />
            )}
          </>
        )}

      {/* Payment proof was uploaded → Ever verifies */}
      {order.status === "confirmed" &&
        order.paymentStatus === "proof_uploaded" && (
          <>
            <Banner
              tone="warning"
              title="Verifica el pago"
              body="Revisa el comprobante. Si el monto y la cuenta coinciden, aprueba."
            />
            <Button
              type="button"
              disabled={loading}
              className="gap-2"
              onClick={() =>
                run(
                  approvePayment,
                  "Pago verificado",
                  "Pedido pasa a preparación.",
                )
              }
            >
              <CheckCircle2 className="size-4" />
              Aprobar pago
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              onClick={() =>
                run(
                  rejectPayment,
                  "Pago rechazado",
                  "El cliente debe reenviar el comprobante.",
                )
              }
            >
              <XCircle className="size-4" />
              Rechazar pago
            </Button>
          </>
        )}

      {/* Step 3 — verified: ready to prepare */}
      {order.status === "confirmed" &&
        order.paymentStatus === "verified" &&
        (order.fulfillmentStatus ?? "unfulfilled") === "unfulfilled" && (
          <>
            <Banner
              tone="info"
              title="Pago confirmado"
              body="Empaqueta y prepara el envío."
            />
            <Button
              type="button"
              disabled={loading}
              className="gap-2"
              onClick={() =>
                run(
                  markPreparing,
                  "En preparación",
                  "Cuando esté listo para salir, márcalo enviado.",
                )
              }
            >
              <Package className="size-4" />
              Marcar como preparando
            </Button>
          </>
        )}

      {/* Step 4 — preparing: ready to ship */}
      {order.fulfillmentStatus === "preparing" && order.status !== "shipped" && (
        <>
          <Banner
            tone="info"
            title="En preparación"
            body="Cuando salga el paquete, márcalo enviado."
          />
          <Button
            type="button"
            disabled={loading}
            className="gap-2"
            onClick={() =>
              run(markShipped, "Pedido enviado", "Cliente recibirá notificación.")
            }
          >
            <Truck className="size-4" />
            Marcar como enviado
          </Button>
        </>
      )}

      {/* Step 5 — shipped: waiting for delivery confirmation */}
      {order.status === "shipped" && (
        <>
          <Banner
            tone="info"
            title="En tránsito"
            body="Cuando el cliente confirme que recibió, márcalo entregado."
          />
          <Button
            type="button"
            disabled={loading}
            className="gap-2"
            onClick={() =>
              run(
                markDelivered,
                "Pedido entregado",
                "Pedido completado correctamente.",
              )
            }
          >
            <CheckCircle2 className="size-4" />
            Marcar como entregado
          </Button>
        </>
      )}

      {/* Universal cancel — available in any non-terminal state */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        className="mt-1 gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
        onClick={() =>
          run(cancelOrder, "Pedido cancelado", "Marcado como cancelado.")
        }
      >
        <XCircle className="size-4" />
        Cancelar pedido
      </Button>
    </div>
  )
}

function Banner({
  tone,
  title,
  body,
}: {
  tone: "warning" | "info" | "success" | "destructive"
  title: string
  body?: string
}) {
  const styles = {
    warning: {
      wrapper: "border-amber-500/20 bg-amber-500/5",
      icon: AlertCircle,
      iconColor: "text-amber-600",
      titleColor: "text-amber-800 dark:text-amber-200",
    },
    info: {
      wrapper: "border-sky-500/20 bg-sky-500/5",
      icon: Clock,
      iconColor: "text-sky-600",
      titleColor: "text-sky-800 dark:text-sky-200",
    },
    success: {
      wrapper: "border-emerald-500/20 bg-emerald-500/5",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-800 dark:text-emerald-200",
    },
    destructive: {
      wrapper: "border-rose-500/20 bg-rose-500/5",
      icon: XCircle,
      iconColor: "text-rose-600",
      titleColor: "text-rose-800 dark:text-rose-200",
    },
  }[tone]
  const Icon = styles.icon
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border p-3 ${styles.wrapper}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${styles.iconColor}`} />
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs font-semibold ${styles.titleColor}`}>
          {title}
        </span>
        {body && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {body}
          </p>
        )}
      </div>
    </div>
  )
}
