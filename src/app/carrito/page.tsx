"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { StorefrontHeader } from "@/components/public/storefront-header"
import { ProductImage } from "@/components/admin/product-image"
import { useCart } from "@/lib/cart/use-cart"

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
}

const M90_NAVY = "#011b53"

export default function CartPage() {
  const { items, totals, hydrated, updateQuantity, removeItem, clear } = useCart()

  if (!hydrated) {
    return (
      <main className="min-h-svh bg-[#f7ebc8]">
        <StorefrontHeader />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8" />
      </main>
    )
  }

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <StorefrontHeader />

      <section className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <h1
          className="font-display text-4xl leading-tight tracking-tight md:text-5xl"
          style={{ color: M90_NAVY }}
        >
          Tu carrito
        </h1>

        {items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[rgba(1,27,83,0.08)]">
              <ShoppingBag className="size-6 text-[#011b53]/60" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">El carrito está vacío</h2>
              <p className="text-sm text-[#011b53]/65">
                Añade algunos jerseys y vuelve aquí para enviar tu pedido por WhatsApp.
              </p>
            </div>
            <Link
              href="/tienda"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-sm font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
            >
              Ir a la tienda
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {/* Items */}
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li
                  key={it.variantId}
                  className="flex items-start gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-[rgba(1,27,83,0.08)] md:p-4"
                >
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[rgba(1,27,83,0.04)] md:size-24">
                    {it.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.primaryImageUrl}
                        alt={it.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ProductImage
                        team={it.team}
                        number={it.number}
                        size="md"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/tienda/${it.productSlug}`}
                      className="line-clamp-2 text-sm font-semibold leading-tight text-[#011b53] hover:text-[#980e21]"
                    >
                      {it.productName}
                    </Link>
                    <p className="text-xs text-[#011b53]/60">
                      Talla {SIZE_LABEL[it.size] ?? it.size} · ${it.unitPrice} c/u
                    </p>

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-[rgba(1,27,83,0.2)] bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(it.variantId, it.quantity - 1)
                          }
                          className="grid size-8 place-items-center text-[#011b53] transition-colors hover:bg-[rgba(1,27,83,0.05)]"
                          aria-label="Reducir"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="grid size-8 place-items-center text-sm font-semibold tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(it.variantId, it.quantity + 1)
                          }
                          className="grid size-8 place-items-center text-[#011b53] transition-colors hover:bg-[rgba(1,27,83,0.05)]"
                          aria-label="Aumentar"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(it.variantId)}
                        className="grid size-8 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-500/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <span className="font-display text-lg tabular-nums md:text-xl">
                    ${(it.unitPrice * it.quantity).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-white/80 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#011b53]/70">Subtotal</span>
                <span className="font-display text-2xl tabular-nums">
                  ${totals.subtotal.toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-[#011b53]/55">
                El envío se calcula al ingresar tu dirección en el checkout.
              </p>
              <Link
                href="/checkout"
                className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#011b53] text-sm font-semibold text-[#efd9a3] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Continuar al checkout
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={clear}
                className="text-center text-xs font-medium text-[#011b53]/55 underline-offset-4 hover:text-[#011b53] hover:underline"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
