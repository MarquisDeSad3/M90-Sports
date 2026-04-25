import { cn } from "@/lib/utils"

export function StockPill({
  total,
  className,
}: {
  total: number
  className?: string
}) {
  if (total === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-rose-500" />
        Agotado
      </span>
    )
  }
  if (total < 5) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-amber-500" />
        Bajo · {total}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {total} en stock
    </span>
  )
}
