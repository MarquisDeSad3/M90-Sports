import * as React from "react"
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface StatCardProps {
  label: string
  value: string
  delta?: {
    value: string
    direction: "up" | "down" | "flat"
    label?: string
  }
  icon?: LucideIcon
  accent?: "default" | "success" | "warning" | "destructive" | "info"
}

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "from-primary/10 to-transparent text-primary",
  success: "from-emerald-500/15 to-transparent text-emerald-500",
  warning: "from-amber-500/15 to-transparent text-amber-500",
  destructive: "from-rose-500/15 to-transparent text-rose-500",
  info: "from-sky-500/15 to-transparent text-sky-500",
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  return (
    <Card className="group relative gap-3 overflow-hidden p-5 transition-shadow hover:shadow-md">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
          accentStyles[accent]
        )}
      />
      <CardContent className="relative flex flex-col gap-2 p-0">
        <div className="flex items-start justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          {Icon && (
            <div
              className={cn(
                "grid size-8 place-items-center rounded-lg bg-gradient-to-br ring-1 ring-inset ring-border/60",
                accentStyles[accent]
              )}
            >
              <Icon className="size-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            {value}
          </span>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                delta.direction === "up" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                delta.direction === "down" &&
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                delta.direction === "flat" &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {delta.direction === "up" && <TrendingUp className="size-3" />}
              {delta.direction === "down" && <TrendingDown className="size-3" />}
              {delta.value}
            </span>
          )}
        </div>
        {delta?.label && (
          <div className="text-xs text-muted-foreground">{delta.label}</div>
        )}
      </CardContent>
    </Card>
  )
}
