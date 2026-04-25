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
  { day: "Lun", sales: 480, orders: 6 },
  { day: "Mar", sales: 720, orders: 9 },
  { day: "Mié", sales: 560, orders: 7 },
  { day: "Jue", sales: 980, orders: 13 },
  { day: "Vie", sales: 1240, orders: 17 },
  { day: "Sáb", sales: 1580, orders: 22 },
  { day: "Dom", sales: 1340, orders: 19 },
]

const total = data.reduce((s, d) => s + d.sales, 0)

export function SalesChart() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Ventas — últimos 7 días</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                ${total.toLocaleString()}
              </span>
              <Badge variant="success" className="text-[10px]">+18% vs semana ant.</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 pb-2">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                  boxShadow: "0 6px 24px -8px rgba(0,0,0,0.15)",
                }}
                formatter={(value: number, name) => [
                  name === "sales" ? `$${value}` : `${value}`,
                  name === "sales" ? "Ventas" : "Pedidos",
                ]}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#salesGrad)"
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
