"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const data = [
  { day: "Lun", sales: 480 },
  { day: "Mar", sales: 720 },
  { day: "Mié", sales: 560 },
  { day: "Jue", sales: 980 },
  { day: "Vie", sales: 1240 },
  { day: "Sáb", sales: 1580 },
  { day: "Dom", sales: 1340 },
]

const total = data.reduce((s, d) => s + d.sales, 0)

export function SalesChart() {
  return (
    <Card className="overflow-hidden rounded-xl border-border/70 bg-card shadow-card">
      <CardHeader className="border-b border-border/60 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Ventas — últimos 7 días
            </CardTitle>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-3xl tracking-tight tabular-nums leading-none text-foreground">
                ${total.toLocaleString()}
              </span>
              <Badge
                variant="secondary"
                className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
              >
                +18% vs semana ant.
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                  boxShadow:
                    "0 4px 12px -2px rgb(1 27 83 / 0.08), 0 12px 32px -8px rgb(1 27 83 / 0.12)",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [`$${value}`, "Ventas"]}
                labelStyle={{ color: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--chart-1)"
                strokeWidth={2.2}
                fill="url(#salesGrad)"
                dot={{
                  fill: "var(--card)",
                  stroke: "var(--chart-1)",
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  fill: "var(--chart-1)",
                  stroke: "var(--card)",
                  strokeWidth: 3,
                  r: 5,
                }}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
