import {
  CheckCircle2,
  Circle,
  Clock,
  Package,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MockOrder, OrderStatus } from "@/lib/mock-orders"

interface Step {
  key: OrderStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
  timestamp?: string
}

export function OrderTimeline({ order }: { order: MockOrder }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
        <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            Pedido cancelado
          </span>
          {order.cancelReason && (
            <span className="text-xs text-muted-foreground">
              {order.cancelReason}
            </span>
          )}
          {order.cancelledAt && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(order.cancelledAt).toLocaleString("es")}
            </span>
          )}
        </div>
      </div>
    )
  }

  const steps: Step[] = [
    {
      key: "pending_confirmation",
      label: "Pedido recibido",
      icon: Clock,
      timestamp: order.createdAt,
    },
    {
      key: "confirmed",
      label: "Confirmado",
      icon: CheckCircle2,
      timestamp: order.confirmedAt,
    },
    {
      key: "paid",
      label: "Pago verificado",
      icon: Wallet,
      timestamp: order.paidAt,
    },
    {
      key: "preparing",
      label: "Preparando",
      icon: Package,
      timestamp: order.status === "preparing" ? order.paidAt : order.paidAt,
    },
    {
      key: "shipped",
      label: "Enviado",
      icon: Truck,
      timestamp: order.shippedAt,
    },
    {
      key: "delivered",
      label: "Entregado",
      icon: CheckCircle2,
      timestamp: order.deliveredAt,
    },
  ]

  const order_progression: OrderStatus[] = [
    "pending_confirmation",
    "confirmed",
    "payment_uploaded",
    "paid",
    "preparing",
    "shipped",
    "delivered",
  ]
  const currentIdx = order_progression.indexOf(order.status)

  return (
    <ol className="relative flex flex-col gap-3.5">
      {steps.map((step, i) => {
        const stepIdx = order_progression.indexOf(step.key)
        const isCompleted = stepIdx < currentIdx
        const isCurrent = step.key === order.status
        const isPending = stepIdx > currentIdx
        const Icon = step.icon
        const isLast = i === steps.length - 1

        return (
          <li key={step.key} className="relative flex items-start gap-3">
            {/* Connector line */}
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[14px] top-7 h-[calc(100%-4px)] w-0.5",
                  isCompleted ? "bg-emerald-500/50" : "bg-border"
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative grid size-7 shrink-0 place-items-center rounded-full ring-2 transition-colors",
                isCompleted &&
                  "bg-emerald-500 text-white ring-emerald-500/20",
                isCurrent && "bg-primary text-primary-foreground ring-primary/20",
                isPending && "bg-muted text-muted-foreground/50 ring-border"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-3.5" />
              ) : isPending ? (
                <Circle className="size-2.5" />
              ) : (
                <Icon className="size-3.5" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-1">
              <span
                className={cn(
                  "text-sm leading-tight",
                  isCurrent && "font-semibold",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.timestamp && (isCompleted || isCurrent) && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(step.timestamp).toLocaleString("es", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
