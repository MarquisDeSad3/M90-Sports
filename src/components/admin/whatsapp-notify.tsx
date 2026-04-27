"use client"

import * as React from "react"
import { Copy, MessageCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MockOrder } from "@/lib/mock-orders"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

interface NotifyTemplate {
  label: string
  body: (ctx: TemplateContext) => string
}

interface TemplateContext {
  order: MockOrder
  trackingUrl: string
  payUrl: string
  customerFirstName: string
}

/**
 * Templates keyed by the situation Ever wants to communicate. The
 * function form lets each template embed dynamic bits — order number,
 * amount, deposit/balance split, links — without a giant switch in the
 * caller. Spanish + a couple of warm emojis because the brand voice on
 * WhatsApp is friendly, not corporate.
 */
const TEMPLATES: Record<string, NotifyTemplate> = {
  confirmed: {
    label: "Pedido confirmado",
    body: ({ order, customerFirstName, trackingUrl }) =>
      [
        `Hola ${customerFirstName} 🙌`,
        ``,
        `Confirmamos tu pedido #${order.orderNumber}.`,
        `Total: $${order.total.toFixed(0)} ${order.currency}`,
        ``,
        `Cuéntame si tienes alguna preferencia con el envío.`,
        ``,
        `Sigue el estado aquí:`,
        trackingUrl,
      ].join("\n"),
  },
  awaiting_deposit: {
    label: "Recordar depósito",
    body: ({ order, customerFirstName, payUrl }) =>
      [
        `Hola ${customerFirstName} 👋`,
        ``,
        `Para reservar tu pedido #${order.orderNumber} necesitamos el depósito de $${order.depositAmount?.toFixed(0)} (30%).`,
        `El saldo de $${order.balanceAmount?.toFixed(0)} lo pagas cuando te llegue.`,
        ``,
        `Súbeme el comprobante aquí:`,
        payUrl,
      ].join("\n"),
  },
  awaiting_proof: {
    label: "Recordar comprobante",
    body: ({ order, customerFirstName, payUrl }) =>
      [
        `Hola ${customerFirstName} 👋`,
        ``,
        `Aún no nos llega el comprobante de tu pedido #${order.orderNumber} ($${order.total.toFixed(0)}).`,
        `Cuando lo tengas, súbelo aquí y reservamos:`,
        payUrl,
      ].join("\n"),
  },
  payment_verified: {
    label: "Pago verificado",
    body: ({ order, customerFirstName, trackingUrl }) =>
      [
        `Hola ${customerFirstName} ✅`,
        ``,
        `Recibimos tu pago para el pedido #${order.orderNumber}.`,
        `Te aviso cuando salga el envío.`,
        ``,
        `Estado: ${trackingUrl}`,
      ].join("\n"),
  },
  payment_rejected: {
    label: "Pago rechazado",
    body: ({ order, customerFirstName, payUrl }) =>
      [
        `Hola ${customerFirstName} 🙏`,
        ``,
        `Tuvimos un problema con el comprobante del pedido #${order.orderNumber}. ¿Puedes subirlo de nuevo?`,
        ``,
        payUrl,
      ].join("\n"),
  },
  sourcing: {
    label: "Pidiendo al proveedor",
    body: ({ order, customerFirstName }) =>
      [
        `Hola ${customerFirstName} 📦`,
        ``,
        `Ya estamos pidiendo tu pedido #${order.orderNumber} al proveedor. En 15-25 días llega a Cuba.`,
        `Te aviso apenas pueda enviarlo.`,
      ].join("\n"),
  },
  in_transit: {
    label: "En camino a Cuba",
    body: ({ order, customerFirstName }) =>
      [
        `Hola ${customerFirstName} ✈️`,
        ``,
        `Tu pedido #${order.orderNumber} ya viene en camino. En unos días llega a Cuba y te coordino la entrega.`,
      ].join("\n"),
  },
  arrived: {
    label: "Llegó — pedir saldo",
    body: ({ order, customerFirstName, payUrl }) =>
      [
        `Hola ${customerFirstName} 🎉`,
        ``,
        `Tu pedido #${order.orderNumber} llegó a Cuba.`,
        `Para enviártelo necesitamos el saldo de $${order.balanceAmount?.toFixed(0)}.`,
        ``,
        `Súbelo aquí:`,
        payUrl,
      ].join("\n"),
  },
  preparing: {
    label: "Preparando envío",
    body: ({ order, customerFirstName }) =>
      [
        `Hola ${customerFirstName} 📦`,
        ``,
        `Estamos preparando tu pedido #${order.orderNumber} para enviarlo. Sale hoy o mañana.`,
      ].join("\n"),
  },
  shipped: {
    label: "Pedido enviado",
    body: ({ order, customerFirstName, trackingUrl }) =>
      [
        `Hola ${customerFirstName} 🚚`,
        ``,
        `Tu pedido #${order.orderNumber} ya salió. Te llega en los próximos días.`,
        ``,
        `Sigue el estado: ${trackingUrl}`,
      ].join("\n"),
  },
  delivered: {
    label: "Confirmar entrega",
    body: ({ order, customerFirstName }) =>
      [
        `Hola ${customerFirstName} 🙌`,
        ``,
        `Tu pedido #${order.orderNumber} fue entregado. ¿Llegó todo bien?`,
        `Cualquier cosa me dices.`,
      ].join("\n"),
  },
  cancelled: {
    label: "Pedido cancelado",
    body: ({ order, customerFirstName }) =>
      [
        `Hola ${customerFirstName} 🙏`,
        ``,
        `Cancelamos tu pedido #${order.orderNumber}. Si quieres reintentarlo o tienes dudas, me dices.`,
      ].join("\n"),
  },
}

interface WhatsappNotifyProps {
  order: MockOrder
  template: keyof typeof TEMPLATES
  size?: "sm" | "default"
  variant?: "filled" | "outline"
  className?: string
}

export function WhatsappNotify({
  order,
  template,
  size = "default",
  variant = "outline",
  className,
}: WhatsappNotifyProps) {
  const [copied, setCopied] = React.useState(false)
  const cfg = TEMPLATES[template]
  if (!cfg) return null

  if (!order.customerPhone) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/30 px-2 py-1 text-[11px] text-muted-foreground">
        Cliente sin WhatsApp
      </span>
    )
  }

  const customerFirstName = (order.customerName ?? "").split(" ")[0] || ""
  const trackingUrl = `${SITE_URL}/pedido/${order.orderNumber}`
  const payUrl = `${SITE_URL}/pedido/${order.orderNumber}/pagar`

  const message = cfg.body({
    order,
    trackingUrl,
    payUrl,
    customerFirstName,
  })

  const phoneClean = order.customerPhone.replace(/[^\d]/g, "")
  const waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard not available — silent */
    }
  }

  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-all"
  const sizeStyles =
    size === "sm" ? "h-7 px-2 text-[11px]" : "h-9 px-3 text-xs"
  const variantStyles =
    variant === "filled"
      ? "bg-[#25D366] text-white hover:-translate-y-0.5 hover:brightness-95"
      : "border border-[#25D366]/40 bg-[#25D366]/10 text-[#0d6e3a] hover:bg-[#25D366]/20"

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Enviar por WhatsApp a ${order.customerName ?? "cliente"}`}
        className={cn(baseStyles, sizeStyles, variantStyles)}
      >
        <MessageCircle className="size-3.5" />
        Avisar: {cfg.label}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title="Copiar mensaje"
        className={cn(
          "grid size-7 place-items-center rounded-md border text-muted-foreground transition-colors",
          copied
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-border hover:bg-accent",
        )}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  )
}
