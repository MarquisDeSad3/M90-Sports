"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Loader2, Search, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductChoice {
  slug: string
  name: string
  team: string | null
}

interface Props {
  products: ProductChoice[]
  initialProductSlug: string | null
  initialOrderNumber: string | null
}

export function ReviewForm({
  products,
  initialProductSlug,
  initialOrderNumber,
}: Props) {
  const [productSlug, setProductSlug] = React.useState<string | null>(
    initialProductSlug,
  )
  const [productSearch, setProductSearch] = React.useState("")
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [rating, setRating] = React.useState<number>(0)
  const [hoverRating, setHoverRating] = React.useState<number>(0)
  const [name, setName] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [orderNumber, setOrderNumber] = React.useState(initialOrderNumber ?? "")
  const [honeypot, setHoneypot] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const selectedProduct =
    productSlug !== null
      ? products.find((p) => p.slug === productSlug) ?? null
      : null

  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 30)
    const q = productSearch.trim().toLowerCase()
    return products
      .filter((p) =>
        [p.name, p.team ?? ""].join(" ").toLowerCase().includes(q),
      )
      .slice(0, 30)
  }, [products, productSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating === 0) {
      setError("Toca las estrellas para puntuar.")
      return
    }
    if (name.trim().length < 2) {
      setError("Ponemos al menos tu nombre o apodo.")
      return
    }
    if (body.trim().length < 10) {
      setError("Cuéntanos un poco más (mínimo 10 caracteres).")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: productSlug ?? undefined,
          rating,
          customerName: name.trim(),
          title: title.trim() || undefined,
          body: body.trim(),
          orderNumber: orderNumber.trim() || undefined,
          _hp: honeypot,
        }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(json.error ?? "No se pudo enviar la reseña.")
      }
      setSuccess(true)
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
        <div className="grid size-12 place-items-center rounded-full bg-emerald-600 text-white">
          <Check className="size-6" />
        </div>
        <h2 className="font-display text-2xl text-emerald-900">
          ¡Gracias por tu reseña!
        </h2>
        <p className="max-w-sm text-sm text-emerald-800">
          La revisamos y, si encaja, la publicamos en menos de 48h. Te avisamos
          por WhatsApp si necesitamos algo más.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {/* Honeypot — never visible to humans */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute left-[-9999px] h-px w-px opacity-0"
        aria-hidden
      />

      {/* Product picker — optional */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Producto <span className="lowercase">(opcional)</span>
          </h3>
          {productSlug && (
            <button
              type="button"
              onClick={() => {
                setProductSlug(null)
                setProductSearch("")
                setPickerOpen(false)
              }}
              className="text-[11px] font-semibold uppercase tracking-wider text-[#980e21] hover:underline"
            >
              Quitar
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-[#011b53]/55">
          Si tu reseña es de un producto específico, búscalo. Si no, déjalo
          en blanco — queda como una reseña general de M90.
        </p>
        {selectedProduct && !pickerOpen ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#011b53] bg-[#011b53]/5 px-3 py-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="line-clamp-1 text-sm font-semibold text-[#011b53]">
                {selectedProduct.name}
              </span>
              {selectedProduct.team && (
                <span className="text-[11px] text-[#011b53]/60">
                  {selectedProduct.team}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerOpen(true)
                setProductSearch("")
              }}
              className="text-[11px] font-semibold uppercase tracking-wider text-[#980e21] hover:underline"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#011b53]/55" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Busca el producto que compraste…"
                className="h-10 w-full rounded-lg border border-[rgba(1,27,83,0.2)] bg-white pl-10 pr-3 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
              />
            </div>
            {productSearch.trim().length > 0 && (
              <ul className="max-h-64 overflow-y-auto rounded-lg border border-[rgba(1,27,83,0.1)] bg-white">
                {filteredProducts.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-[#011b53]/55">
                    Sin resultados.
                  </li>
                ) : (
                  filteredProducts.map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          setProductSlug(p.slug)
                          setPickerOpen(false)
                        }}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-[#011b53]/5",
                          p.slug === productSlug && "bg-[#011b53]/5",
                        )}
                      >
                        <span className="line-clamp-1 text-sm font-medium text-[#011b53]">
                          {p.name}
                        </span>
                        {p.team && (
                          <span className="text-[11px] text-[#011b53]/55">
                            {p.team}
                          </span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Rating with half-star precision */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
          Tu puntuación
        </h3>
        <div
          className="mt-2 flex items-center gap-0.5"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((i) => {
            const display = hoverRating || rating
            return (
              <div key={i} className="relative size-12">
                {/* Background outline star */}
                <Star
                  className="absolute inset-1 size-9 fill-transparent stroke-[#011b53]/25"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {/* Foreground filled star, clipped to current rating */}
                <Star
                  className="absolute inset-1 size-9 fill-amber-400 stroke-amber-500 transition-[clip-path]"
                  strokeWidth={1.5}
                  style={{
                    clipPath:
                      display >= i
                        ? "inset(0 0 0 0)"
                        : display >= i - 0.5
                          ? "inset(0 50% 0 0)"
                          : "inset(0 100% 0 0)",
                  }}
                  aria-hidden
                />
                {/* Two click zones overlay: left half = i-0.5, right = i */}
                <button
                  type="button"
                  onClick={() => setRating(i - 0.5)}
                  onMouseEnter={() => setHoverRating(i - 0.5)}
                  aria-label={`${i - 0.5} estrellas`}
                  className="absolute inset-y-0 left-0 w-1/2"
                />
                <button
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
                  className="absolute inset-y-0 right-0 w-1/2"
                />
              </div>
            )
          })}
          {rating > 0 && (
            <span className="ml-3 text-sm font-semibold text-[#011b53] tabular-nums">
              {rating}/5
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-[#011b53]/55">
          Toca el lado izquierdo de una estrella para medio punto.
        </p>
      </div>

      {/* Identity */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
          Quién eres
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#011b53]/65">
              Nombre o apodo *
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yoel R."
              maxLength={60}
              required
              className="h-10 rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#011b53]/65">
              Número de pedido (opcional, acelera la verificación)
            </span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="M90-000123"
              maxLength={40}
              className="h-10 rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 font-mono text-sm uppercase text-[#011b53] outline-none focus:border-[#011b53]"
            />
          </label>
        </div>
      </div>

      {/* Body */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
          Tu reseña
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#011b53]/65">
              Título (opcional)
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ej: "Llegó perfecta y rápida"'
              maxLength={80}
              className="h-10 rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 text-sm text-[#011b53] outline-none focus:border-[#011b53]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#011b53]/65">
              Tu experiencia *
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Cuéntanos cómo te llegó, qué tal la calidad, la talla, el envío…"
              maxLength={1500}
              rows={5}
              required
              className="rounded-lg border border-[rgba(1,27,83,0.2)] bg-white px-3 py-2 text-sm leading-relaxed text-[#011b53] outline-none focus:border-[#011b53]"
            />
            <span className="text-[11px] text-[#011b53]/55 tabular-nums">
              {body.length} / 1500
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition-all",
          submitting
            ? "cursor-wait bg-[rgba(1,27,83,0.15)] text-white"
            : "bg-[#011b53] text-[#efd9a3] hover:-translate-y-0.5 hover:bg-[#0a2a75]",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar reseña"
        )}
      </button>

      <p className="text-center text-[11px] text-[#011b53]/55">
        Tu reseña queda en revisión. Si encaja, la publicamos en el
        producto en menos de 48h.
      </p>
    </form>
  )
}
