import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/mock-orders"

const styles: Record<
  OrderStatus,
  { className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending_confirmation: {
    className:
      "bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    icon: AlertCircle,
  },
  confirmed: {
    className: "bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    icon: Clock,
  },
  payment_uploaded: {
    className:
      "bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    icon: Wallet,
  },
  paid: {
    className: "bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    icon: CheckCircle2,
  },
  preparing: {
    className:
      "bg-violet-500/12 text-violet-700 ring-violet-500/20 dark:text-violet-300",
    icon: Package,
  },
  shipped: {
    className:
      "bg-indigo-500/12 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
    icon: Truck,
  },
  delivered: {
    className:
      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  cancelled: {
    className:
      "bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    icon: XCircle,
  },
}

export function OrderStatusBadge({
  status,
  size = "default",
}: {
  status: OrderStatus
  size?: "default" | "sm"
}) {
  const s = styles[status]
  const Icon = s.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium ring-1 ring-inset",
        s.className,
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "default" && "px-2 py-0.5 text-[11px]"
      )}
    >
      <Icon className={cn(size === "sm" ? "size-2.5" : "size-3")} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  )
}
