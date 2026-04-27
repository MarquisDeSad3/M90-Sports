"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  PlaneTakeoff,
  ShoppingCart,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { WhatsappNotify } from "@/components/admin/whatsapp-notify"
import type { MockOrder } from "@/lib/mock-orders"
import {
  approveBalance,
  approveDeposit,
  approvePayment,
  cancelOrder,
  confirmOrder,
  markDelivered,
  markPaidCoD,
  markPreparing,
  markShipped,
  rejectPayment,
  setSourcingStatus,
} from "@/app/admin/(panel)/orders/actions"

interface OrderActionsProps {
  order: MockOrder
}

type ServerAction = (id: string) => Promise<{ ok: true } | { ok: false; error: string }>

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

  // Whether this order is split into deposit + balance.
  const isPreorder =
    order.depositAmount !== null && order.depositAmount !== undefined

  // Terminal states first.
  if (order.status === "delivered") {
    return (
      <div className="flex flex-col gap-2.5">
        <Banner
          tone="success"
          title="Pedido entregado"
          body="El pedido ya llegó al cliente."
        />
        <WhatsappNotify order={order} template="delivered" />
      </div>
    )
  }
  if (order.status === "cancelled") {
    return (
      <div className="flex flex-col gap-2.5">
        <Banner
          tone="destructive"
          title="Pedido cancelado"
          body={order.cancelReason}
        />
        <WhatsappNotify order={order} template="cancelled" />
      </div>
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
            body="Habla con el cliente por WhatsApp y confirma cuando esté todo OK."
          />
          <Button
            type="button"
            disabled={loading}
            className="gap-2"
            onClick={() =>
              run(
                confirmOrder,
                "Pedido confirmado",
                isPreorder
                  ? "Avisa al cliente del depósito a pagar."
                  : "Avisa al cliente para que proceda con el pago.",
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
          <WhatsappNotify order={order} template="confirmed" />
        </>
      )}

      {/* PRE-ORDER FLOW
          confirmed → wait for deposit → mark sourcing → in_transit → arrived →
          wait for balance → preparing → shipped → delivered */}
      {order.status === "confirmed" && isPreorder && (
        <>
          {/* Awaiting deposit */}
          {!order.depositPaidAt && (
            <>
              <Banner
                tone="warning"
                title="Esperando depósito"
                body={`El cliente debe pagar $${order.depositAmount?.toFixed(0)} ahora. Cuando recibas el comprobante, apruébalo aquí.`}
              />
              {order.paymentMethod === "cash_on_delivery" ? (
                <Button
                  type="button"
                  disabled={loading}
                  className="gap-2"
                  onClick={() =>
                    run(
                      approveDeposit,
                      "Depósito recibido",
                      "Pasa a buscar el producto al proveedor.",
                    )
                  }
                >
                  <Wallet className="size-4" />
                  Marcar depósito recibido
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={loading}
                  className="gap-2"
                  onClick={() =>
                    run(
                      approveDeposit,
                      "Depósito aprobado",
                      "Pasa a buscar el producto al proveedor.",
                    )
                  }
                >
                  <CheckCircle2 className="size-4" />
                  Aprobar depósito
                </Button>
              )}
              <WhatsappNotify order={order} template="awaiting_deposit" />
            </>
          )}

          {/* Sourcing flow — after deposit is in */}
          {order.depositPaidAt && order.sourcingStatus === "sourcing" && (
            <>
              <Banner
                tone="info"
                title="Pidiendo al proveedor"
                body="Cuando el proveedor confirme el envío hacia Cuba, márcalo en camino."
              />
              <Button
                type="button"
                disabled={loading}
                className="gap-2"
                onClick={() =>
                  run(
                    () => setSourcingStatus(order.id, "in_transit"),
                    "Marcado en camino",
                    "Cuando llegue al stock, márcalo aquí.",
                  )
                }
              >
                <PlaneTakeoff className="size-4" />
                Marcar en camino
              </Button>
              <WhatsappNotify order={order} template="sourcing" />
            </>
          )}

          {order.depositPaidAt && order.sourcingStatus === "in_transit" && (
            <>
              <Banner
                tone="info"
                title="En camino a Cuba"
                body="Cuando el producto llegue a tu stock, márcalo y pídele al cliente el saldo."
              />
              <Button
                type="button"
                disabled={loading}
                className="gap-2"
                onClick={() =>
                  run(
                    () => setSourcingStatus(order.id, "arrived"),
                    "Llegó al stock",
                    "Avisa al cliente para que pague el saldo.",
                  )
                }
              >
                <PackageCheck className="size-4" />
                Marcar como llegado
              </Button>
              <WhatsappNotify order={order} template="in_transit" />
            </>
          )}

          {/* Arrived — awaiting balance */}
          {order.depositPaidAt &&
            order.sourcingStatus === "arrived" &&
            !order.balancePaidAt && (
              <>
                <Banner
                  tone="warning"
                  title="Esperando saldo"
                  body={`El producto está en tu stock. El cliente debe pagar $${order.balanceAmount?.toFixed(0)} para que se le envíe.`}
                />
                <Button
                  type="button"
                  disabled={loading}
                  className="gap-2"
                  onClick={() =>
                    run(
                      approveBalance,
                      "Saldo recibido",
                      "Pasa a preparación del envío.",
                    )
                  }
                >
                  <CheckCircle2 className="size-4" />
                  Aprobar saldo
                </Button>
                <WhatsappNotify order={order} template="arrived" />
              </>
            )}

          {/* Balance paid — ready to prepare */}
          {order.balancePaidAt &&
            (order.fulfillmentStatus ?? "unfulfilled") === "unfulfilled" && (
              <>
                <Banner
                  tone="info"
                  title="Listo para preparar"
                  body="Saldo recibido. Empaqueta y prepara el envío al cliente."
                />
                <Button
                  type="button"
                  disabled={loading}
                  className="gap-2"
                  onClick={() =>
                    run(markPreparing, "En preparación", "Cuando salga, márcalo enviado.")
                  }
                >
                  <Package className="size-4" />
                  Marcar como preparando
                </Button>
                <WhatsappNotify order={order} template="payment_verified" />
              </>
            )}
        </>
      )}

      {/* IN-STOCK FLOW — original behavior, unchanged */}
      {order.status === "confirmed" &&
        !isPreorder &&
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
              <>
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
                <WhatsappNotify order={order} template="awaiting_proof" />
              </>
            )}
          </>
        )}

      {order.status === "confirmed" &&
        !isPreorder &&
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
                run(approvePayment, "Pago verificado", "Pedido pasa a preparación.")
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
                run(rejectPayment, "Pago rechazado", "Cliente debe reenviar el comprobante.")
              }
            >
              <XCircle className="size-4" />
              Rechazar pago
            </Button>
            <div className="flex flex-wrap gap-2">
              <WhatsappNotify
                order={order}
                template="payment_verified"
                size="sm"
              />
              <WhatsappNotify
                order={order}
                template="payment_rejected"
                size="sm"
              />
            </div>
          </>
        )}

      {order.status === "confirmed" &&
        !isPreorder &&
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
                run(markPreparing, "En preparación", "Cuando esté listo para salir, márcalo enviado.")
              }
            >
              <Package className="size-4" />
              Marcar como preparando
            </Button>
            <WhatsappNotify order={order} template="payment_verified" />
          </>
        )}

      {/* SHARED FLOW from preparing → shipped → delivered */}
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
          <WhatsappNotify order={order} template="preparing" />
        </>
      )}

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
              run(markDelivered, "Pedido entregado", "Pedido completado correctamente.")
            }
          >
            <CheckCircle2 className="size-4" />
            Marcar como entregado
          </Button>
          <WhatsappNotify order={order} template="shipped" />
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

/** Compact preorder progress strip rendered next to the order summary. */
export function PreorderProgress({ order }: { order: MockOrder }) {
  if (order.depositAmount === null || order.depositAmount === undefined) {
    return null
  }
  const steps: { label: string; done: boolean }[] = [
    { label: "Depósito recibido", done: !!order.depositPaidAt },
    {
      label: "Pidiendo al proveedor",
      done:
        !!order.depositPaidAt &&
        ["sourcing", "in_transit", "arrived"].includes(
          order.sourcingStatus ?? "",
        ),
    },
    {
      label: "En camino",
      done:
        !!order.depositPaidAt &&
        ["in_transit", "arrived"].includes(order.sourcingStatus ?? ""),
    },
    {
      label: "Llegó al stock",
      done: order.sourcingStatus === "arrived",
    },
    { label: "Saldo recibido", done: !!order.balancePaidAt },
  ]
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <ShoppingCart className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pedido por encargo
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className={`grid size-4 place-items-center rounded-full ${
                s.done
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Clock className="size-3" />
              )}
            </span>
            <span className={s.done ? "" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
