import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Eye,
  ImageOff,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  ScrollText,
  StickyNote,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import { OrderTimeline } from "@/components/admin/order-timeline"
import { OrderActions } from "@/components/admin/order-actions"
import { ProductImage } from "@/components/admin/product-image"
import { getOrder } from "@/lib/queries/orders"
import {
  ORDER_SOURCE_LABEL,
  PAYMENT_METHOD_LABEL,
  timeAgo,
} from "@/lib/mock-orders"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 size-9 shrink-0">
            <Link href="/admin/orders" aria-label="Volver">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-xl font-semibold tracking-tight md:text-2xl">
                {order.orderNumber}
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ScrollText className="size-3" />
                {ORDER_SOURCE_LABEL[order.source]}
              </span>
              <span>·</span>
              <span>creado {timeAgo(order.createdAt)}</span>
              {order.confirmedAt && (
                <>
                  <span>·</span>
                  <span>confirmado {timeAgo(order.confirmedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener">
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          {[
            "pending_confirmation",
            "confirmed",
            "payment_uploaded",
            "paid",
          ].includes(order.status) && (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Layout: items left, sidebar right */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* LEFT */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* WhatsApp message */}
          {order.whatsappPreview && (
            <Card className="rounded-xl border-emerald-500/20 bg-emerald-500/[0.04] shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="size-4 text-emerald-600" />
                  Mensaje del cliente (WhatsApp)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="border-l-2 border-emerald-500/40 pl-4 text-sm italic leading-relaxed text-foreground/90">
                  &ldquo;{order.whatsappPreview}&rdquo;
                </blockquote>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card className="overflow-hidden rounded-xl border-border/70 shadow-card">
            <CardHeader className="border-b">
              <CardTitle className="text-base">
                Productos ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <ProductImage
                      team={item.team}
                      number={item.number}
                      size="md"
                      imageUrl={item.imageUrl}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <Link
                        href={`/admin/products/${item.productId}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {item.productName}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Talla {item.variantSize.replace("KIDS_", "Niño ")}</span>
                        <span>·</span>
                        <span className="tabular-nums">
                          ${item.unitPrice} × {item.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums">
                      ${item.subtotal}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Cliente {order.isDiaspora ? "(Diáspora)" : "(Cuba)"}</span>
                {order.isDiaspora && (
                  <Badge
                    variant="outline"
                    className="border-sky-500/30 text-sky-700 dark:text-sky-300"
                  >
                    {order.country}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Nombre
                </span>
                <span className="text-sm font-medium">{order.customerName}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Teléfono / WhatsApp
                </span>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary"
                >
                  <Phone className="size-3" />
                  {order.customerPhone}
                </a>
              </div>
              {order.customerEmail && (
                <div className="flex flex-col gap-0.5 md:col-span-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </span>
                  <span className="text-sm font-medium">
                    {order.customerEmail}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-muted-foreground" />
                Dirección de entrega (Cuba)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Recibe
                    </span>
                    <span className="font-semibold">
                      {order.shippingAddress.recipientName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {order.shippingAddress.phone}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Dirección
                    </span>
                    <span>
                      {order.shippingAddress.street}
                      {order.shippingAddress.number &&
                        ` ${order.shippingAddress.number}`}
                    </span>
                    {order.shippingAddress.betweenStreets && (
                      <span className="text-xs text-muted-foreground">
                        {order.shippingAddress.betweenStreets}
                      </span>
                    )}
                    {order.shippingAddress.neighborhood && (
                      <span className="text-xs text-muted-foreground">
                        {order.shippingAddress.neighborhood}
                      </span>
                    )}
                    <span className="text-sm">
                      {order.shippingAddress.municipality},{" "}
                      <span className="font-medium">
                        {order.shippingAddress.province}
                      </span>
                    </span>
                  </div>
                  {order.shippingAddress.reference && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Referencia
                        </span>
                        <span className="text-xs italic text-muted-foreground">
                          {order.shippingAddress.reference}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{order.shippingMethod}</span>
                <span>
                  Costo:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    ${order.shippingCost.toFixed(2)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment proof */}
          {order.proofUploaded && (
            <Card className="rounded-xl border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Comprobante de pago</span>
                  {order.paymentTransactionRef && (
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {order.paymentTransactionRef}
                    </code>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/40">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ImageOff className="size-8 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">
                      Vista previa del comprobante
                      <br />
                      (mock — sin imagen real)
                    </span>
                    <Button variant="outline" size="sm" className="mt-1 gap-1.5">
                      <Eye className="size-3.5" />
                      Ver imagen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer notes */}
          {order.notesCustomer && (
            <Card className="rounded-xl border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="size-4 text-muted-foreground" />
                  Nota del cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {order.notesCustomer}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: actions + summary */}
        <div className="flex flex-col gap-5">
          {/* Action card */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderActions order={order} />
            </CardContent>
          </Card>

          {/* Total summary */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  ${order.subtotal.toFixed(2)}
                </span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Descuento{" "}
                    {order.couponCode && (
                      <code className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                        {order.couponCode}
                      </code>
                    )}
                  </span>
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-300">
                    −${order.discountTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="tabular-nums">
                  ${order.shippingCost.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-2xl tabular-nums">
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Método de pago</span>
                <Badge variant="secondary" className="font-medium">
                  {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estado pago</span>
                {order.paymentVerified ? (
                  <Badge variant="success">Verificado</Badge>
                ) : order.proofUploaded ? (
                  <Badge variant="warning">Por verificar</Badge>
                ) : (
                  <Badge variant="outline">Pendiente</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Cronología</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          {/* Internal notes */}
          {order.notesInternal && (
            <Card className="rounded-xl border-amber-500/20 bg-amber-500/[0.04] shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
                  <StickyNote className="size-4" />
                  Nota interna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {order.notesInternal}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
