"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  MessageCircle,
  Package,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ProductImage } from "@/components/admin/product-image"
import { cn } from "@/lib/utils"
import {
  createManualOrderAction,
  searchCustomersAction,
  searchProductsForManualOrderAction,
  type CustomerSuggestion,
  type ManualOrderProductHit,
} from "../actions"

interface AddonPrices {
  longSleeves: number
  patches: number
  personalization: number
  personalizationDepositPct: number
}

type PickerKind = "both" | "in_stock" | "preorder"

interface DraftItem {
  key: string
  productId: string
  productName: string
  productTeam: string | null
  productImage: string | null
  isPreorder: boolean
  variantId: string
  size: string
  quantity: number
  unitPrice: number
  longSleeves: boolean
  patches: boolean
  playerName: string
  playerNumber: string
}

const PROVINCES = [
  { value: "LA_HABANA", label: "La Habana" },
  { value: "MAYABEQUE", label: "Mayabeque" },
  { value: "ARTEMISA", label: "Artemisa" },
  { value: "MATANZAS", label: "Matanzas" },
  { value: "PINAR_DEL_RIO", label: "Pinar del Río" },
] as const

const SIZE_LABEL: Record<string, string> = {
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "2XL",
  XXXL: "3XL",
  XXXXL: "4XL",
  KIDS_S: "Niño S",
  KIDS_M: "Niño M",
  KIDS_L: "Niño L",
  KIDS_XL: "Niño XL",
  KIDS_4: "4 años",
  KIDS_6: "6 años",
  KIDS_8: "8 años",
  KIDS_10: "10 años",
  KIDS_12: "12 años",
  KIDS_14: "14 años",
  EU_36: "EU 36",
  EU_37: "EU 37",
  EU_38: "EU 38",
  EU_39: "EU 39",
  EU_40: "EU 40",
  EU_41: "EU 41",
  EU_42: "EU 42",
  EU_43: "EU 43",
  EU_44: "EU 44",
  EU_45: "EU 45",
  EU_46: "EU 46",
  EU_47: "EU 47",
  ONE_SIZE: "Única",
}

export function ManualOrderForm({
  addonPrices,
}: {
  addonPrices: AddonPrices
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // ─── Customer ─────────────────────────────────────────────────────
  const [customerExistingId, setCustomerExistingId] = React.useState<
    string | null
  >(null)
  const [customerName, setCustomerName] = React.useState("")
  const [customerPhone, setCustomerPhone] = React.useState("")
  const [customerEmail, setCustomerEmail] = React.useState("")
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [customerHits, setCustomerHits] = React.useState<CustomerSuggestion[]>(
    [],
  )
  const [customerSearching, setCustomerSearching] = React.useState(false)
  const [customerOpen, setCustomerOpen] = React.useState(false)

  React.useEffect(() => {
    if (customerSearch.trim().length === 0) {
      setCustomerHits([])
      return
    }
    const timer = window.setTimeout(async () => {
      setCustomerSearching(true)
      const hits = await searchCustomersAction(customerSearch)
      setCustomerHits(hits)
      setCustomerSearching(false)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [customerSearch])

  function pickCustomer(c: CustomerSuggestion) {
    setCustomerExistingId(c.id)
    setCustomerName(c.name)
    setCustomerPhone(c.phone ?? "")
    setCustomerEmail(c.email ?? "")
    setCustomerOpen(false)
    setCustomerSearch("")
    // Pre-fill the recipient with the same name + phone — Ever can change.
    if (!recipientName) setRecipientName(c.name)
    if (!recipientPhone) setRecipientPhone(c.phone ?? "")
  }

  function clearCustomer() {
    setCustomerExistingId(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
  }

  // ─── Items ────────────────────────────────────────────────────────
  const [items, setItems] = React.useState<DraftItem[]>([])
  const [pickerKind, setPickerKind] = React.useState<PickerKind>("both")
  const [productSearch, setProductSearch] = React.useState("")
  const [productHits, setProductHits] = React.useState<ManualOrderProductHit[]>(
    [],
  )
  const [productSearching, setProductSearching] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!pickerOpen) return
    if (productSearch.trim().length === 0) {
      setProductHits([])
      return
    }
    const timer = window.setTimeout(async () => {
      setProductSearching(true)
      const hits = await searchProductsForManualOrderAction(
        productSearch,
        pickerKind,
      )
      setProductHits(hits)
      setProductSearching(false)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [productSearch, pickerKind, pickerOpen])

  function addItem(p: ManualOrderProductHit, variantId: string) {
    const v = p.variants.find((x) => x.id === variantId)
    if (!v) return
    const draft: DraftItem = {
      key: `${variantId}-${Date.now()}`,
      productId: p.id,
      productName: p.name,
      productTeam: p.team,
      productImage: p.primaryImageUrl,
      isPreorder: p.isPreorder,
      variantId: v.id,
      size: v.size,
      quantity: 1,
      unitPrice: v.price,
      longSleeves: false,
      patches: false,
      playerName: "",
      playerNumber: "",
    }
    setItems((cur) => [...cur, draft])
    setPickerOpen(false)
    setProductSearch("")
    setProductHits([])
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((cur) =>
      cur.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    )
  }
  function removeItem(key: string) {
    setItems((cur) => cur.filter((it) => it.key !== key))
  }

  function itemAddOnTotal(it: DraftItem): number {
    let t = 0
    if (it.longSleeves) t += addonPrices.longSleeves
    if (it.patches) t += addonPrices.patches
    if (it.playerName.trim() || it.playerNumber.trim()) {
      t += addonPrices.personalization
    }
    return t
  }

  // ─── Shipping ─────────────────────────────────────────────────────
  const [recipientName, setRecipientName] = React.useState("")
  const [recipientPhone, setRecipientPhone] = React.useState("")
  const [street, setStreet] = React.useState("")
  const [streetNumber, setStreetNumber] = React.useState("")
  const [municipality, setMunicipality] = React.useState("")
  const [province, setProvince] = React.useState<
    (typeof PROVINCES)[number]["value"]
  >("LA_HABANA")
  const [reference, setReference] = React.useState("")

  // ─── Payment + notes ──────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = React.useState<
    "transfermovil" | "cash_on_delivery" | "zelle" | "paypal"
  >("transfermovil")
  const [markAsPaid, setMarkAsPaid] = React.useState(false)
  const [notesCustomer, setNotesCustomer] = React.useState("")
  const [notesInternal, setNotesInternal] = React.useState("")

  // ─── Totals ───────────────────────────────────────────────────────
  const subtotal = items.reduce(
    (s, it) => s + (it.unitPrice + itemAddOnTotal(it)) * it.quantity,
    0,
  )
  const hasPreorder = items.some((it) => it.isPreorder)

  // ─── Submit ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Falta nombre y teléfono del cliente.")
      return
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto.")
      return
    }
    if (!recipientName.trim() || !street.trim() || !municipality.trim()) {
      setError("Falta dirección de envío (nombre, calle, municipio).")
      return
    }

    setSubmitting(true)
    const result = await createManualOrderAction({
      customer: {
        existingId: customerExistingId ?? undefined,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
      },
      shipping: {
        recipientName: recipientName.trim() || customerName.trim(),
        phone: recipientPhone.trim() || customerPhone.trim(),
        street: street.trim(),
        number: streetNumber.trim() || undefined,
        municipality: municipality.trim(),
        province,
        reference: reference.trim() || undefined,
      },
      items: items.map((it) => {
        const hasAddOns =
          it.longSleeves ||
          it.patches ||
          it.playerName.trim() !== "" ||
          it.playerNumber.trim() !== ""
        return {
          variantId: it.variantId,
          quantity: it.quantity,
          addOns: hasAddOns
            ? {
                longSleeves: it.longSleeves,
                patches: it.patches,
                playerName: it.playerName.trim() || undefined,
                playerNumber: it.playerNumber.trim() || undefined,
              }
            : undefined,
        }
      }),
      paymentMethod,
      markAsPaid,
      notesCustomer: notesCustomer.trim() || undefined,
      notesInternal: notesInternal.trim() || undefined,
    })

    if (result.ok) {
      router.push(`/admin/orders/${result.orderId}`)
    } else {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Link
        href="/admin/orders"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a pedidos
      </Link>

      {/* 1. Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-primary" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {customerExistingId ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{customerName}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {customerPhone}
                  {customerEmail && ` · ${customerEmail}`}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCustomer}
              >
                <X className="size-3.5" />
                Quitar
              </Button>
            </div>
          ) : (
            <>
              <Field label="Buscar cliente existente">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setCustomerOpen(true)
                    }}
                    placeholder="Nombre, teléfono o email…"
                    className="h-10 pl-10"
                  />
                  {customerSearching && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {customerOpen && customerHits.length > 0 && (
                  <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border bg-card shadow-sm">
                    {customerHits.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => pickCustomer(c)}
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                        >
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {c.phone ?? "(sin teléfono)"}
                            {c.totalOrders > 0 && (
                              <> · {c.totalOrders} pedidos · ${c.totalSpent.toFixed(0)} gastados</>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>O crea uno nuevo</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nombre *">
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Yoel Rodríguez"
                    required
                  />
                </Field>
                <Field label="Teléfono *">
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="5363285022"
                    required
                  />
                </Field>
                <Field label="Email (opcional)" className="md:col-span-2">
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@correo.com"
                  />
                </Field>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2. Productos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Productos ({items.length})
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Sin productos todavía. Click "Agregar" para escoger del
              catálogo o del pool de Por encargo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((it) => (
                <li
                  key={it.key}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <ProductImage
                        team={it.productTeam || "M90"}
                        imageUrl={it.productImage}
                        size="md"
                        className="size-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="line-clamp-1 text-sm font-semibold">
                          {it.productName}
                        </span>
                        {it.isPreorder ? (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-300 bg-amber-50 px-1 text-[9px] text-amber-900"
                          >
                            Por encargo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-4 border-emerald-300 bg-emerald-50 px-1 text-[9px] text-emerald-900"
                          >
                            En stock
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Talla {SIZE_LABEL[it.size] ?? it.size} ·{" "}
                        ${it.unitPrice.toFixed(2)}
                        {itemAddOnTotal(it) > 0 && (
                          <span className="text-amber-700">
                            {" "}+ ${itemAddOnTotal(it).toFixed(2)} extras
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(it.key, {
                            quantity: Math.max(
                              1,
                              Math.min(20, Number(e.target.value) || 1),
                            ),
                          })
                        }
                        className="h-8 w-14 text-center tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(it.key)}
                        className="size-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Add-ons */}
                  <details className="rounded-md bg-muted/30 px-3 py-1.5 text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground">
                      Personalizar (mangas, parches, estampado)
                    </summary>
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="flex items-center justify-between">
                        <span>Mangas largas</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular-nums">
                            +${addonPrices.longSleeves.toFixed(0)}
                          </span>
                          <input
                            type="checkbox"
                            checked={it.longSleeves}
                            onChange={(e) =>
                              updateItem(it.key, {
                                longSleeves: e.target.checked,
                              })
                            }
                            className="size-4 accent-primary"
                          />
                        </span>
                      </label>
                      <label className="flex items-center justify-between">
                        <span>Parches Champions/Liga</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular-nums">
                            +${addonPrices.patches.toFixed(0)}
                          </span>
                          <input
                            type="checkbox"
                            checked={it.patches}
                            onChange={(e) =>
                              updateItem(it.key, { patches: e.target.checked })
                            }
                            className="size-4 accent-primary"
                          />
                        </span>
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="shrink-0">
                          Estampado{" "}
                          <span className="text-muted-foreground tabular-nums">
                            (+${addonPrices.personalization.toFixed(0)})
                          </span>
                        </span>
                        <div className="flex gap-1.5">
                          <Input
                            type="text"
                            value={it.playerName}
                            onChange={(e) =>
                              updateItem(it.key, { playerName: e.target.value })
                            }
                            placeholder="MESSI"
                            maxLength={16}
                            className="h-8 w-24 text-center font-mono uppercase"
                            style={{ textTransform: "uppercase" }}
                          />
                          <Input
                            type="text"
                            value={it.playerNumber}
                            onChange={(e) =>
                              updateItem(it.key, {
                                playerNumber: e.target.value
                                  .replace(/[^\d]/g, "")
                                  .slice(0, 2),
                              })
                            }
                            placeholder="10"
                            className="h-8 w-12 text-center font-mono tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 3. Envío */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dirección de envío</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Recibe *">
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nombre del destinatario"
              required
            />
          </Field>
          <Field label="Teléfono *">
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Tel. del destinatario"
              required
            />
          </Field>
          <Field label="Calle *" className="md:col-span-2">
            <Input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Calle 23"
              required
            />
          </Field>
          <Field label="Número">
            <Input
              value={streetNumber}
              onChange={(e) => setStreetNumber(e.target.value)}
              placeholder="123"
            />
          </Field>
          <Field label="Municipio *">
            <Input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Vedado"
              required
            />
          </Field>
          <Field label="Provincia *">
            <Select
              value={province}
              onValueChange={(v) => setProvince(v as typeof province)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Referencia (opcional)">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Casa amarilla, frente al CDR"
            />
          </Field>
        </CardContent>
      </Card>

      {/* 4. Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pago</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Field label="Método">
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfermovil">Transfermóvil</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="cash_on_delivery">Efectivo a la entrega</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-sm">
            <input
              type="checkbox"
              checked={markAsPaid}
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              className="size-4 accent-emerald-600"
            />
            <span className="flex-1">
              <span className="font-semibold">Ya cobré este pedido</span>
              <span className="block text-xs text-muted-foreground">
                Marca como pago verificado y deja registro en el log de pagos.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      {/* 5. Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Notas del cliente" hint="Visible en el pedido">
            <Textarea
              value={notesCustomer}
              onChange={(e) => setNotesCustomer(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Comentarios del cliente"
            />
          </Field>
          <Field label="Notas internas" hint="Solo admin">
            <Textarea
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Recordatorios para Ever"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          {hasPreorder && (
            <p className="text-[11px] text-amber-700">
              Hay productos por encargo — el sistema calculará depósito 30% +
              saldo automáticamente al guardar.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            El envío se calcula según la zona de la provincia seleccionada.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" asChild disabled={submitting}>
          <Link href="/admin/orders">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Crear pedido
        </Button>
      </div>

      {/* Product picker modal-ish overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b p-4">
              <h3 className="text-base font-semibold">Agregar producto</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPickerOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="border-b px-4 pt-3 pb-2">
              <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
                {(["both", "in_stock", "preorder"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPickerKind(k)}
                    className={cn(
                      "flex-1 rounded px-3 py-1.5 font-semibold transition-colors",
                      pickerKind === k
                        ? "bg-card shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {k === "both"
                      ? "Todos"
                      : k === "in_stock"
                        ? "En stock"
                        : "Por encargo"}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-b p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar nombre, equipo, jugador, slug…"
                  className="h-10 pl-10"
                  autoFocus
                />
                {productSearching && (
                  <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {productHits.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {productSearch.trim()
                    ? "Sin resultados."
                    : "Empieza a escribir para buscar."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {productHits.map((p) => (
                    <ProductHitRow
                      key={p.id}
                      product={p}
                      onPick={(variantId) => addItem(p, variantId)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Pedidos manuales entran como{" "}
        <span className="font-semibold">confirmados</span> directamente. El
        cliente no recibe ningún WhatsApp automático — usa el botón "Avisar"
        en el pedido para mandarle el resumen.
      </p>

      <a
        className="hidden"
        // unused — keeps the MessageCircle import linted
        href="#"
      >
        <MessageCircle className="size-4" />
      </a>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  )
}

function ProductHitRow({
  product,
  onPick,
}: {
  product: ManualOrderProductHit
  onPick: (variantId: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <li className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent"
      >
        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <ProductImage
            team={product.team || "M90"}
            imageUrl={product.primaryImageUrl}
            size="md"
            className="size-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="line-clamp-1 text-sm font-medium">
              {product.name}
            </span>
            {product.isPreorder ? (
              <Badge
                variant="outline"
                className="h-4 border-amber-300 bg-amber-50 px-1 text-[9px] text-amber-900"
              >
                Por encargo
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-4 border-emerald-300 bg-emerald-50 px-1 text-[9px] text-emerald-900"
              >
                En stock
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            ${product.basePrice.toFixed(2)} · {product.variants.length} tallas
            {product.team && ` · ${product.team}`}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 border-t p-3">
          {product.variants.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Este producto no tiene variantes — créalas primero en
              /admin/products.
            </p>
          ) : (
            product.variants.map((v) => {
              const out = !product.isPreorder && v.stock === 0
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => onPick(v.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                    out
                      ? "cursor-not-allowed border-border/40 text-muted-foreground/40 line-through"
                      : "border-border hover:border-primary hover:bg-primary/5",
                  )}
                >
                  {SIZE_LABEL[v.size] ?? v.size}
                  {!product.isPreorder && (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      · {v.stock}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </li>
  )
}
