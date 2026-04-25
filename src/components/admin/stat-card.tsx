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
  default:
    "bg-primary/8 text-primary ring-primary/10",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-500/12 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  destructive:
    "bg-rose-500/10 text-rose-700 ring-rose-500/15 dark:text-rose-300",
  info:
    "bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:text-sky-300",
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  return (
    <Card className="group gap-2.5 rounded-xl border-border/70 bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <CardContent className="flex flex-col gap-2.5 p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          {Icon && (
            <div
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
                accentStyles[accent]
              )}
            >
              <Icon className="size-[17px]" strokeWidth={2} />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display text-3xl tracking-tight tabular-nums leading-none text-foreground md:text-[32px]">
            {value}
          </span>
          {delta && (
            <span
              className={cn(
                "mb-0.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                delta.direction === "up" &&
                  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                delta.direction === "down" &&
                  "bg-rose-500/12 text-rose-700 dark:text-rose-300",
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
