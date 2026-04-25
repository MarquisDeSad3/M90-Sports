"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
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
import {
  AlertCircle,
} from "lucide-react"
import type { MockOrder } from "@/lib/mock-orders"

interface OrderActionsProps {
  order: MockOrder
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const trigger = (
    successMsg: string,
    description: string,
    redirectBack = false
  ) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(successMsg, { description })
      if (redirectBack) router.push("/admin/orders")
    }, 700)
  }

  // Cancelled or Delivered — terminal state, no action
  if (order.status === "delivered") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Pedido entregado
          </span>
          <span className="text-xs text-muted-foreground">
            Pedido completado correctamente.
          </span>
        </div>
      </div>
    )
  }

  if (order.status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
        <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            Pedido cancelado
          </span>
          {order.cancelReason && (
            <span className="text-xs text-muted-foreground">
              {order.cancelReason}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {order.status === "pending_confirmation" && (
        <>
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Acción requerida
              </span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Habla con el cliente por WhatsApp, edita lo que sea necesario y
                confirma cuando esté todo OK.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="gap-2"
            disabled={loading}
            onClick={() =>
              trigger(
                "Pedido confirmado",
                "Avisa al cliente para que proceda con el pago.",
                true
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
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
            onClick={() =>
              trigger("Pedido cancelado", "Marcado como cancelado.", true)
            }
          >
            <XCircle className="size-4" />
            Cancelar pedido
          </Button>
        </>
      )}

      {order.status === "confirmed" && !order.proofUploaded && (
        <>
          <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-sky-600" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-200">
                Esperando pago
              </span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                El cliente debe realizar el pago y subir el comprobante (o pagar
                contra entrega).
              </p>
            </div>
          </div>
          {order.paymentMethod === "cash_on_delivery" ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() =>
                trigger(
                  "Marcado como pagado",
                  "Pasa a preparación.",
                  true
                )
              }
            >
              <Wallet className="size-4" />
              Marcar como pagado (CoD)
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled
            >
              <Wallet className="size-4" />
              Esperando comprobante
            </Button>
          )}
        </>
      )}

      {order.status === "payment_uploaded" && (
        <>
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <Wallet className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Verifica el pago
              </span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Revisa el comprobante en{" "}
                {order.paymentMethod === "transfermovil"
                  ? "Transfermóvil"
                  : order.paymentMethod}
                . Si el monto y la cuenta coinciden, aprueba.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="gap-2"
            onClick={() =>
              trigger(
                "Pago verificado",
                "Pedido pasa a preparación.",
                true
              )
            }
          >
            <CheckCircle2 className="size-4" />
            Aprobar pago
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
            onClick={() =>
              trigger(
                "Pago rechazado",
                "Cliente debe reenviar comprobante.",
                false
              )
            }
          >
            <XCircle className="size-4" />
            Rechazar pago
          </Button>
        </>
      )}

      {order.status === "paid" && (
        <Button
          type="button"
          className="gap-2"
          onClick={() =>
            trigger(
              "Marcado como preparando",
              "Empaqueta y prepara para envío.",
              true
            )
          }
        >
          <Package className="size-4" />
          Marcar como preparando
        </Button>
      )}

      {order.status === "preparing" && (
        <Button
          type="button"
          className="gap-2"
          onClick={() =>
            trigger(
              "Pedido enviado",
              "Cliente recibirá notificación.",
              true
            )
          }
        >
          <Truck className="size-4" />
          Marcar como enviado
        </Button>
      )}

      {order.status === "shipped" && (
        <Button
          type="button"
          className="gap-2"
          onClick={() =>
            trigger(
              "Pedido entregado",
              "¡Genial! Pedido completado.",
              true
            )
          }
        >
          <CheckCircle2 className="size-4" />
          Marcar como entregado
        </Button>
      )}

      {/* Universal cancel button (except in terminal states) */}
      {!["pending_confirmation", "delivered", "cancelled"].includes(
        order.status
      ) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
          onClick={() =>
            trigger("Pedido cancelado", "Marcado como cancelado.", true)
          }
        >
          <XCircle className="size-4" />
          Cancelar pedido
        </Button>
      )}
    </div>
  )
}
