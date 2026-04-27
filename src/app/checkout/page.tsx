"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageCircle,
} from "lucide-react"
import { Nav } from "@/components/nav"
import { useCart } from "@/lib/cart/use-cart"
import { cn } from "@/lib/utils"

const M90_NAVY = "#011b53"

const PROVINCES = [
  { value: "LA_HABANA", label: "La Habana" },
  { value: "MAYABEQUE", label: "Mayabeque" },
  { value: "ARTEMISA", label: "Artemisa" },
  { value: "MATANZAS", label: "Matanzas" },
  { value: "PINAR_DEL_RIO", label: "Pinar del Río" },
] as const

const PAYMENT_METHODS: {
  value: "transfermovil" | "cash_on_delivery" | "zelle" | "paypal"
  label: string
  desc: string
  diasporaOnly?: boolean
}[] = [
  {
    value: "transfermovil",
    label: "Transfermóvil",
    desc: "Pago desde la app del banco cubano",
  },
  {
    value: "cash_on_delivery",
    label: "Efectivo a la entrega",
    desc: "Pagas al mensajero cuando recibes",
  },
  {
    value: "zelle",
    label: "Zelle",
    desc: "Para clientes con cuenta en EE. UU.",
    diasporaOnly: true,
  },
  {
    value: "paypal",
    label: "PayPal",
    desc: "Para clientes en el exterior",
    diasporaOnly: true,
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totals, hydrated, clear } = useCart()

  const [isDiaspora, setIsDiaspora] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form fields
  const [customerName, setCustomerName] = React.useState("")
  const [customerPhone, setCustomerPhone] = React.useState("")
  const [customerEmail, setCustomerEmail] = React.useState("")
  const [country, setCountry] = React.useState("CU")
  const [recipientName, setRecipientName] = React.useState("")
  const [recipientPhone, setRecipientPhone] = React.useState("")
  const [street, setStreet] = React.useState("")
  const [number, setNumber] = React.useState("")
  const [betweenStreets, setBetweenStreets] = React.useState("")
  const [neighborhood, setNeighborhood] = React.useState("")
  const [municipality, setMunicipality] = React.useState("")
  const [province, setProvince] = React.useState<typeof PROVINCES[number]["value"]>("LA_HABANA")
  const [reference, setReference] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState<typeof PAYMENT_METHODS[number]["value"]>("transfermovil")
  const [notes, setNotes] = React.useState("")
  const [couponCode, setCouponCode] = React.useState("")

  // Anti-bot signals (read by /api/orders). The honeypot is an
  // invisible input — real users never see or fill it. The timestamp
  // lets the server reject submissions that happen unrealistically fast.
  const [honeypot, setHoneypot] = React.useState("")
  const formStartedAt = React.useRef<number>(Date.now())

  React.useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      router.replace("/")
    }
  }, [hydrated, items.length, router, submitting])

  const filteredPayments = PAYMENT_METHODS.filter(
    (m) => isDiaspora || !m.diasporaOnly
  )

  React.useEffect(() => {
    // Reset payment method if it becomes invalid for the current mode
    if (
      !isDiaspora &&
      (paymentMethod === "zelle" || paymentMethod === "paypal")
    ) {
      setPaymentMethod("transfermovil")
    }
  }, [isDiaspora, paymentMethod])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            variantId: it.variantId,
            quantity: it.quantity,
          })),
          customer: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            country: isDiaspora ? country : "CU",
          },
          shippingAddress: {
            recipientName: recipientName.trim() || customerName.trim(),
            phone: recipientPhone.trim() || customerPhone.trim(),
            street: street.trim(),
            number: number.trim() || undefined,
            betweenStreets: betweenStreets.trim() || undefined,
            neighborhood: neighborhood.trim() || undefined,
            municipality: municipality.trim(),
            province,
            reference: reference.trim() || undefined,
          },
          paymentMethod,
          notesCustomer: notes.trim() || undefined,
          couponCode: couponCode.trim() || undefined,
          _hp: honeypot,
          _t: formStartedAt.current,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el pedido.")
        setSubmitting(false)
        return
      }

      // Clear cart and redirect to WhatsApp
      clear()
      window.location.href = data.whatsappUrl
    } catch (err) {
      setError(
        "Error de red. Revisa tu conexión y vuelve a intentar. " +
          ((err as Error).message ?? "")
      )
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-svh bg-[#f7ebc8]">
        <Nav />
      </main>
    )
  }

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      <div className="mx-auto max-w-2xl px-5 pt-28 pb-2 md:px-8 md:pt-32">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#011b53]/75 transition-colors hover:text-[#011b53]"
        >
          <ArrowLeft className="size-4" />
          Volver a la tienda
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pb-20 md:px-8"
      >
        {/* Honeypot — kept off-screen, hidden from AT and users. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          style={{ position: "absolute", left: "-10000px", top: "auto" }}
        >
          <label>
            Si eres humano, deja este campo en blanco.
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <h1
          className="font-display text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ color: M90_NAVY }}
        >
          Confirma tu pedido
        </h1>

        {/* Diaspora toggle */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white/80 p-4 ring-1 ring-[rgba(1,27,83,0.08)]">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            ¿Dónde estás tú?
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDiaspora(false)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all",
                !isDiaspora
                  ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                  : "border-[rgba(1,27,83,0.2)] bg-white text-[#011b53] hover:border-[#011b53]"
              )}
            >
              🇨🇺 En Cuba
            </button>
            <button
              type="button"
              onClick={() => setIsDiaspora(true)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all",
                isDiaspora
                  ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                  : "border-[rgba(1,27,83,0.2)] bg-white text-[#011b53] hover:border-[#011b53]"
              )}
            >
              ✈️ En el exterior
            </button>
          </div>
          {isDiaspora && (
            <p className="mt-1 text-xs text-[#011b53]/60">
              Pagas tú desde fuera, el jersey llega a tu familia en Cuba.
            </p>
          )}
        </div>

        {/* Customer */}
        <Section title="Tus datos (quien paga)">
          <Field label="Nombre completo *" required>
            <Input value={customerName} onChange={setCustomerName} required />
          </Field>
          <Field label="Teléfono / WhatsApp *" required>
            <Input
              value={customerPhone}
              onChange={setCustomerPhone}
              placeholder={isDiaspora ? "+1 305 555 0123" : "+53 5XXX XXXX"}
              required
              type="tel"
            />
          </Field>
          {isDiaspora && (
            <>
              <Field label="Email">
                <Input
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  type="email"
                  placeholder="tu@email.com"
                />
              </Field>
              <Field label="País">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
                >
                  <option value="US">Estados Unidos</option>
                  <option value="ES">España</option>
                  <option value="MX">México</option>
                  <option value="CA">Canadá</option>
                  <option value="OTHER">Otro</option>
                </select>
              </Field>
            </>
          )}
        </Section>

        {/* Shipping address */}
        <Section title={`Entrega ${isDiaspora ? "(en Cuba)" : ""}`}>
          {isDiaspora && (
            <>
              <Field label="Nombre de quien recibe en Cuba *">
                <Input
                  value={recipientName}
                  onChange={setRecipientName}
                  placeholder="Ej: Jorge Pérez (sobrino)"
                  required
                />
              </Field>
              <Field label="Teléfono cubano de quien recibe *">
                <Input
                  value={recipientPhone}
                  onChange={setRecipientPhone}
                  placeholder="+53 5XXX XXXX"
                  type="tel"
                  required
                />
              </Field>
            </>
          )}
          <Field label="Calle *" required>
            <Input
              value={street}
              onChange={setStreet}
              placeholder="Calle 23"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <Input value={number} onChange={setNumber} placeholder="#456" />
            </Field>
            <Field label="Entre calles">
              <Input
                value={betweenStreets}
                onChange={setBetweenStreets}
                placeholder="entre J y K"
              />
            </Field>
          </div>
          <Field label="Reparto / barrio">
            <Input
              value={neighborhood}
              onChange={setNeighborhood}
              placeholder="Vedado"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Municipio *" required>
              <Input
                value={municipality}
                onChange={setMunicipality}
                placeholder="Plaza"
                required
              />
            </Field>
            <Field label="Provincia *" required>
              <select
                value={province}
                onChange={(e) =>
                  setProvince(
                    e.target.value as typeof PROVINCES[number]["value"]
                  )
                }
                required
                className="h-11 w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
              >
                {PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Referencia (cómo encontrar la casa)">
            <Input
              value={reference}
              onChange={setReference}
              placeholder="Ej: Edificio amarillo frente al parque"
            />
          </Field>
        </Section>

        {/* Payment method */}
        <Section title="Método de pago">
          <div className="flex flex-col gap-2">
            {filteredPayments.map((m) => (
              <label
                key={m.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all",
                  paymentMethod === m.value
                    ? "border-[#011b53] bg-[#011b53]/5"
                    : "border-[rgba(1,27,83,0.15)] bg-white hover:border-[#011b53]/30"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.value}
                  checked={paymentMethod === m.value}
                  onChange={() => setPaymentMethod(m.value)}
                  className="mt-1 size-4 accent-[#011b53]"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{m.label}</span>
                  <span className="text-xs text-[#011b53]/65">{m.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Coupon */}
        <Section title="Cupón (opcional)">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Ej. BIENVENIDO10"
            maxLength={40}
            autoComplete="off"
            className="w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider text-[#011b53] outline-none focus:border-[#011b53]"
          />
          <p className="mt-1 text-[11px] text-[#011b53]/55">
            Si tienes un código de descuento, escríbelo arriba. Lo aplicamos al confirmar.
          </p>
        </Section>

        {/* Notes */}
        <Section title="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cualquier mensaje para Ever..."
            rows={3}
            className="w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 py-2 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
          />
        </Section>

        {/* Order summary */}
        <div className="rounded-2xl border-2 border-[#011b53]/15 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Resumen
          </h3>
          <ul className="mt-3 flex flex-col gap-1.5">
            {items.map((it) => (
              <li
                key={it.variantId}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="line-clamp-1 flex-1">
                  {it.quantity}× {it.productName}{" "}
                  <span className="text-[#011b53]/50">({it.size})</span>
                </span>
                <span className="font-semibold tabular-nums">
                  ${(it.unitPrice * it.quantity).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-[rgba(1,27,83,0.1)] pt-3">
            <span className="text-sm font-semibold">Subtotal</span>
            <span className="font-display text-xl tabular-nums">
              ${totals.subtotal.toFixed(0)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#011b53]/55">
            El envío se calcula automáticamente según tu provincia.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className={cn(
            "group inline-flex h-14 items-center justify-center gap-2 rounded-full text-base font-semibold shadow-xl transition-transform",
            !submitting &&
              items.length > 0 &&
              "bg-[#011b53] text-[#efd9a3] hover:-translate-y-0.5 hover:bg-[#0a2a75]"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Creando pedido...
            </>
          ) : (
            <>
              <MessageCircle className="size-5" />
              Pedir por WhatsApp
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-[#011b53]/55">
          Al confirmar se abrirá WhatsApp con tu pedido para que Ever te confirme
          todo personalmente.
        </p>
      </form>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[#011b53]/75">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-11 w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 text-sm text-[#011b53] placeholder:text-[#011b53]/40 outline-none transition-colors focus:border-[#011b53]"
    />
  )
}
