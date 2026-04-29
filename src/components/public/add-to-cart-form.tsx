"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ShoppingBag } from "lucide-react"
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

export interface AddonPrices {
  longSleeves: number
  patches: number
  personalization: number
  personalizationDepositPct: number
}

export interface ShoeAddonPrices {
  originalBox: number
  extraStuds: number
  embroidery: number
}

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
  WOMEN_S: "Mujer S",
  WOMEN_M: "Mujer M",
  WOMEN_L: "Mujer L",
  WOMEN_XL: "Mujer XL",
  EU_36: "36",
  EU_37: "37",
  EU_38: "38",
  EU_39: "39",
  EU_40: "40",
  EU_41: "41",
  EU_42: "42",
  EU_43: "43",
  EU_44: "44",
  EU_45: "45",
  EU_46: "46",
  EU_47: "47",
  ONE_SIZE: "Única",
}

export function AddToCartForm({
  product,
  addonPrices,
  shoeAddonPrices,
  isShoe,
}: {
  product: ProductForCart
  addonPrices: AddonPrices
  shoeAddonPrices: ShoeAddonPrices
  isShoe: boolean
}) {
  const { addItem } = useCart()
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    product.variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = React.useState(1)
  const [justAdded, setJustAdded] = React.useState(false)

  // Jersey add-ons
  const [longSleeves, setLongSleeves] = React.useState(false)
  const [patches, setPatches] = React.useState(false)
  const [personalization, setPersonalization] = React.useState(false)
  const [playerName, setPlayerName] = React.useState("")
  const [playerNumber, setPlayerNumber] = React.useState("")

  // Shoe add-ons
  const [originalBox, setOriginalBox] = React.useState(false)
  const [extraStuds, setExtraStuds] = React.useState(false)
  const [embroidery, setEmbroidery] = React.useState(false)
  const [embroideryInitials, setEmbroideryInitials] = React.useState("")

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const canBuy =
    selectedVariant !== undefined &&
    (product.isPreorder || selectedVariant.stock > 0)

  const addOnTotal = isShoe
    ? (originalBox ? shoeAddonPrices.originalBox : 0) +
      (extraStuds ? shoeAddonPrices.extraStuds : 0) +
      (embroidery ? shoeAddonPrices.embroidery : 0)
    : (longSleeves ? addonPrices.longSleeves : 0) +
      (patches ? addonPrices.patches : 0) +
      (personalization ? addonPrices.personalization : 0)

  const baseUnit = selectedVariant?.price ?? product.basePrice
  const lineUnit = baseUnit + addOnTotal

  const handleAdd = () => {
    if (!selectedVariant) return
    const trimmedName = playerName.trim()
    const trimmedNumber = playerNumber.trim()
    const trimmedInitials = embroideryInitials.trim().toUpperCase()

    let cartAddOns: CartItem["addOns"] | undefined
    if (isShoe) {
      const hasShoeAddOns = originalBox || extraStuds || embroidery
      if (hasShoeAddOns) {
        cartAddOns = {
          // We tunnel shoe-specific add-ons through the same shape as
          // jerseys: longSleeves=originalBox, patches=extraStuds,
          // playerName=embroidery initials. Cart drawer + WhatsApp
          // message are aware of the product context.
          longSleeves: originalBox,
          patches: extraStuds,
          playerName:
            embroidery && trimmedInitials ? trimmedInitials : undefined,
          playerNumber: undefined,
          total: addOnTotal,
        }
      }
    } else {
      const hasAddOns = longSleeves || patches || personalization
      if (hasAddOns) {
        cartAddOns = {
          longSleeves,
          patches,
          playerName:
            personalization && trimmedName ? trimmedName : undefined,
          playerNumber:
            personalization && trimmedNumber ? trimmedNumber : undefined,
          total: addOnTotal,
        }
      }
    }

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
      addOns: cartAddOns,
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

      {/* Add-ons — shoe context vs jersey context */}
      <fieldset className="flex flex-col gap-2 rounded-xl border border-[rgba(1,27,83,0.12)] bg-white/60 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/60">
          Personaliza tu pedido
        </legend>

        {isShoe ? (
          <>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={originalBox}
                  onChange={(e) => setOriginalBox(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">Caja original</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${shoeAddonPrices.originalBox.toFixed(0)}
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={extraStuds}
                  onChange={(e) => setExtraStuds(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">
                  Tacos extras{" "}
                  <span className="text-[11px] text-[#011b53]/55">
                    (SG/FG)
                  </span>
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${shoeAddonPrices.extraStuds.toFixed(0)}
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={embroidery}
                  onChange={(e) => setEmbroidery(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">
                  Bordado con iniciales
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${shoeAddonPrices.embroidery.toFixed(0)}
              </span>
            </label>

            {embroidery && (
              <div className="mt-2 flex flex-col gap-2 rounded-lg bg-[rgba(1,27,83,0.04)] p-3">
                <p className="text-[11px] text-[#011b53]/65">
                  Iniciales bordadas a un lado del talón. Hasta 4 caracteres.
                </p>
                <input
                  type="text"
                  value={embroideryInitials}
                  onChange={(e) =>
                    setEmbroideryInitials(
                      e.target.value.toUpperCase().slice(0, 4),
                    )
                  }
                  placeholder="YR"
                  maxLength={4}
                  style={{ textTransform: "uppercase" }}
                  className="h-9 w-32 rounded-md border border-[rgba(1,27,83,0.2)] bg-white px-2 text-center text-sm font-mono uppercase tracking-wider text-[#011b53] outline-none focus:border-[#011b53]"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={longSleeves}
                  onChange={(e) => setLongSleeves(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">Mangas largas</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${addonPrices.longSleeves.toFixed(0)}
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={patches}
                  onChange={(e) => setPatches(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">Parches Champions/Liga</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${addonPrices.patches.toFixed(0)}
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgba(1,27,83,0.04)]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={personalization}
                  onChange={(e) => setPersonalization(e.target.checked)}
                  className="size-4 accent-[#011b53]"
                />
                <span className="text-sm text-[#011b53]">
                  Estampado nombre + dorsal
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#980e21]">
                +${addonPrices.personalization.toFixed(0)}
              </span>
            </label>

            {personalization && (
              <div className="mt-2 flex flex-col gap-2 rounded-lg bg-[rgba(1,27,83,0.04)] p-3">
                <p className="text-[11px] text-[#011b53]/65">
                  Anticipo del {addonPrices.personalizationDepositPct}% requerido ·
                  +24h al tiempo de entrega
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="MESSI"
                    maxLength={16}
                    style={{ textTransform: "uppercase" }}
                    className="h-9 flex-1 rounded-md border border-[rgba(1,27,83,0.2)] bg-white px-2 text-sm font-mono uppercase tracking-wider text-[#011b53] outline-none focus:border-[#011b53]"
                  />
                  <input
                    type="text"
                    value={playerNumber}
                    onChange={(e) =>
                      setPlayerNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 2))
                    }
                    placeholder="10"
                    inputMode="numeric"
                    className="h-9 w-16 rounded-md border border-[rgba(1,27,83,0.2)] bg-white px-2 text-center text-sm font-mono tabular-nums text-[#011b53] outline-none focus:border-[#011b53]"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {addOnTotal > 0 && (
          <div className="mt-1 flex items-center justify-between border-t border-[rgba(1,27,83,0.08)] pt-2 text-xs font-semibold text-[#011b53]">
            <span>Total con extras</span>
            <span className="tabular-nums">
              ${lineUnit.toFixed(2)} × {quantity} = ${(lineUnit * quantity).toFixed(2)}
            </span>
          </div>
        )}
      </fieldset>

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
