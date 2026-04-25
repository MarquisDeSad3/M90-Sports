"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Loader2, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart, type CartItem } from "@/lib/cart/use-cart"
import type { Size } from "@/lib/mock-data"

interface ProductForCart {
  id: string
  slug: string
  name: string
  team: string
  number?: string
  basePrice: number
  primaryImageUrl?: string | null
  variants: { id: string; size: Size; stock: number; sku: string; price: number }[]
  isPreorder: boolean
}

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
  WOMEN_S: "Mujer S",
  WOMEN_M: "Mujer M",
  WOMEN_L: "Mujer L",
  WOMEN_XL: "Mujer XL",
  ONE_SIZE: "Única",
}

export function AddToCartForm({ product }: { product: ProductForCart }) {
  const { addItem } = useCart()
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    product.variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = React.useState(1)
  const [justAdded, setJustAdded] = React.useState(false)

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const canBuy =
    selectedVariant !== undefined &&
    (product.isPreorder || selectedVariant.stock > 0)

  const handleAdd = () => {
    if (!selectedVariant) return
    const item: CartItem = {
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      team: product.team,
      number: product.number,
      size: selectedVariant.size,
      unitPrice: selectedVariant.price,
      quantity,
      primaryImageUrl: product.primaryImageUrl,
    }
    addItem(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
  }

  if (product.variants.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 p-4 text-center text-sm text-rose-700">
        Sin variantes disponibles. Escríbenos por WhatsApp.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sizes */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/60">
          Talla
        </label>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => {
            const out = !product.isPreorder && v.stock === 0
            const selected = v.id === selectedVariantId
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "min-w-[56px] rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
                  selected &&
                    "border-[#011b53] bg-[#011b53] text-[#efd9a3] shadow-sm",
                  !selected &&
                    !out &&
                    "border-[rgba(1,27,83,0.2)] bg-white text-[#011b53] hover:border-[#011b53]",
                  out &&
                    "cursor-not-allowed border-[rgba(1,27,83,0.1)] bg-white/40 text-[#011b53]/30 line-through"
                )}
              >
                {SIZE_LABEL[v.size] ?? v.size}
                {!product.isPreorder && v.stock > 0 && v.stock < 3 && selected && (
                  <span className="ml-1 text-[10px] font-medium">
                    · {v.stock} izq
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantity */}
      {selectedVariant && canBuy && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/60">
            Cantidad
          </label>
          <div className="inline-flex w-fit items-center rounded-lg border border-[rgba(1,27,83,0.2)] bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="size-10 text-lg font-semibold text-[#011b53] transition-colors hover:bg-[rgba(1,27,83,0.05)]"
              aria-label="Reducir cantidad"
            >
              −
            </button>
            <span className="grid size-10 place-items-center font-semibold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="size-10 text-lg font-semibold text-[#011b53] transition-colors hover:bg-[rgba(1,27,83,0.05)]"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to cart CTA */}
      <button
        type="button"
        disabled={!canBuy || justAdded}
        onClick={handleAdd}
        className={cn(
          "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-lg transition-all",
          canBuy &&
            !justAdded &&
            "bg-[#011b53] text-[#efd9a3] hover:-translate-y-0.5 hover:bg-[#0a2a75]",
          justAdded && "bg-emerald-600 text-white",
          !canBuy && "cursor-not-allowed bg-[rgba(1,27,83,0.2)] text-white"
        )}
      >
        {justAdded ? (
          <>
            <Check className="size-4" />
            ¡Añadido al carrito!
          </>
        ) : !canBuy ? (
          <>Agotado</>
        ) : (
          <>
            <ShoppingBag className="size-4" />
            {product.isPreorder ? "Reservar (pre-orden)" : "Añadir al carrito"}
          </>
        )}
      </button>

      {justAdded && (
        <Link
          href="/carrito"
          className="text-center text-sm font-semibold text-[#980e21] underline-offset-4 hover:underline"
        >
          Ir al carrito →
        </Link>
      )}
    </div>
  )
}
