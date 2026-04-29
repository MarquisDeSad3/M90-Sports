"use client"

import * as React from "react"
import Link from "next/link"
import { Check, MessageCircle, ShoppingBag, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart, type CartItem } from "@/lib/cart/use-cart"
import { ProductImage } from "@/components/admin/product-image"
import type { PublicProduct } from "@/lib/queries/public-products"

const SIZE_LABEL: Record<string, string> = {
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "3XL",
  KIDS_S: "Niño S",
  KIDS_M: "Niño M",
  KIDS_L: "Niño L",
  KIDS_XL: "Niño XL",
  ONE_SIZE: "Única",
}

function detectBadge(p: PublicProduct): { label: string; tone: "new" | "retro" | "limited" | "sale" } | null {
  if (p.compareAtPrice && p.compareAtPrice > p.basePrice) return { label: "oferta", tone: "sale" }
  if (p.versionType === "retro") return { label: "retro", tone: "retro" }
  if (p.featured) return { label: "nuevo", tone: "new" }
  return null
}

function detectKicker(p: PublicProduct): string {
  if (p.versionType === "retro") return "Retro"
  if (p.season === "2024-25" || p.season === "2025-26" || p.season === "2025") return "Temporada actual"
  if (p.season === "2026") return "Temporada 2026"
  if (p.season) return p.season
  return "Edición"
}

export function ProductCardCart({ product }: { product: PublicProduct }) {
  const { addItem } = useCart()
  const sizesAvailable = product.variants.filter((v) => v.stock > 0 || product.isPreorder)
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    sizesAvailable[0]?.id ?? product.variants[0]?.id ?? null
  )
  const [justAdded, setJustAdded] = React.useState(false)
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const canBuy =
    selectedVariant !== undefined &&
    (product.isPreorder || selectedVariant.stock > 0)

  const badge = detectBadge(product)
  const kicker = detectKicker(product)
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
  // Preorder products that haven't been priced yet (basePrice === 0) skip
  // the cart entirely and route the customer to a WhatsApp quote request.
  const needsQuote = product.isPreorder && product.basePrice === 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedVariant) return
    const item: CartItem = {
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      team: product.team ?? "",
      number: product.number ?? undefined,
      size: selectedVariant.size,
      unitPrice: selectedVariant.price,
      quantity: 1,
      primaryImageUrl: product.primaryImageUrl,
    }
    addItem(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article className="group flex flex-col gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-[rgba(1,27,83,0.08)] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(1,27,83,0.12)]">
      <Link
        href={`/tienda/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[rgba(1,27,83,0.04)]"
      >
        {product.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <ProductImage
            team={product.team ?? "M90"}
            number={product.number ?? undefined}
            size="lg"
            className="size-32"
          />
        )}

        {badge && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
              badge.tone === "new" && "bg-emerald-600",
              badge.tone === "retro" && "bg-amber-700",
              badge.tone === "limited" && "bg-violet-700",
              badge.tone === "sale" && "bg-rose-600"
            )}
          >
            {badge.label}
          </span>
        )}

        {product.featured && (
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#011b53] text-[#efd9a3]">
            <Sparkles className="size-3.5" />
          </span>
        )}
      </Link>

      <div className="flex min-h-[28px] flex-col gap-0.5 px-1">
        {product.team && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#011b53]/55">
            {product.team}
          </span>
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#011b53]/45">
          {kicker}
        </span>
      </div>

      <Link href={`/tienda/${product.slug}`} className="px-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-[#011b53] hover:text-[#980e21]">
          {product.name}
        </h3>
      </Link>

      <div className="flex items-baseline gap-2 px-1">
        {needsQuote ? (
          <span className="text-sm font-semibold uppercase tracking-wider text-[#980e21]">
            Por encargo
          </span>
        ) : (
          <>
            <span className="font-display text-2xl tabular-nums text-[#011b53]">
              ${product.basePrice.toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[#011b53]/50 line-through tabular-nums">
                ${product.compareAtPrice!.toFixed(0)}
              </span>
            )}
          </>
        )}
      </div>

      {/* Sizes inline (hidden for products that need a quote — sizes get
          discussed by WhatsApp anyway). */}
      {!needsQuote && product.variants.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {product.variants.map((v) => {
            const out = !product.isPreorder && v.stock === 0
            const selected = v.id === selectedVariantId
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedVariantId(v.id)
                }}
                className={cn(
                  "min-w-[34px] rounded-md border px-1.5 py-1 text-[11px] font-semibold transition-all",
                  selected &&
                    !out &&
                    "border-[#011b53] bg-[#011b53] text-[#efd9a3]",
                  !selected &&
                    !out &&
                    "border-[rgba(1,27,83,0.18)] bg-white text-[#011b53] hover:border-[#011b53]/60",
                  out &&
                    "cursor-not-allowed border-[rgba(1,27,83,0.08)] bg-white/40 text-[#011b53]/30 line-through"
                )}
              >
                {SIZE_LABEL[v.size] ?? v.size}
              </button>
            )
          })}
        </div>
      )}

      {/* CTA */}
      {needsQuote ? (
        <a
          href={`https://wa.me/5363285022?text=${encodeURIComponent(
            `Hola M90, me interesa este producto: ${product.name}.\n\n¿Cuánto cuesta y cuándo llega?`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-95"
        >
          <MessageCircle className="size-3.5" />
          Consultar por WhatsApp
        </a>
      ) : (
        <button
          type="button"
          disabled={!canBuy || justAdded}
          onClick={handleAdd}
          className={cn(
            "group/btn mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all",
            canBuy &&
              !justAdded &&
              "bg-[#011b53] text-[#efd9a3] hover:-translate-y-0.5 hover:bg-[#0a2a75]",
            justAdded && "bg-emerald-600 text-white",
            !canBuy && "cursor-not-allowed bg-[rgba(1,27,83,0.15)] text-white",
          )}
        >
          {justAdded ? (
            <>
              <Check className="size-3.5" />
              Añadido
            </>
          ) : !canBuy ? (
            "Agotado"
          ) : (
            <>
              <ShoppingBag className="size-3.5" />
              Agregar
            </>
          )}
        </button>
      )}
    </article>
  )
}
