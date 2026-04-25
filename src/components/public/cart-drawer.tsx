"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { useCart } from "@/lib/cart/use-cart"
import { ProductImage } from "@/components/admin/product-image"
import { cn } from "@/lib/utils"

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

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totals, hydrated, updateQuantity, removeItem, clear } = useCart()

  // Lock scroll when drawer is open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  // Close on ESC
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-[#011b53]/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Carrito"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#f7ebc8] shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ color: "#011b53" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(1,27,83,0.12)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-[#011b53]" />
            <h2 className="font-display text-2xl tracking-tight">Tu carrito</h2>
            {hydrated && totals.itemCount > 0 && (
              <span className="grid size-6 place-items-center rounded-full bg-[#980e21] text-[11px] font-bold text-white">
                {totals.itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-[#011b53]/70 transition-colors hover:bg-[rgba(1,27,83,0.08)] hover:text-[#011b53]"
            aria-label="Cerrar carrito"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Body */}
        {hydrated && items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[rgba(1,27,83,0.08)]">
              <ShoppingBag className="size-6 text-[#011b53]/60" />
            </div>
            <h3 className="text-lg font-semibold">Está vacío</h3>
            <p className="max-w-xs text-sm text-[#011b53]/65">
              Añade tus jerseys favoritos y vuelve cuando estés listo.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-sm font-semibold text-[#efd9a3] hover:-translate-y-0.5 transition-transform"
            >
              Seguir comprando
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[rgba(1,27,83,0.08)] overflow-y-auto px-3 py-2">
              {items.map((it) => (
                <li
                  key={it.variantId}
                  className="flex items-start gap-3 px-2 py-3"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[rgba(1,27,83,0.04)]">
                    {it.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.primaryImageUrl}
                        alt={it.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ProductImage team={it.team} number={it.number} size="sm" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/tienda/${it.productSlug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-sm font-semibold leading-tight text-[#011b53] hover:text-[#980e21]"
                    >
                      {it.productName}
                    </Link>
                    <span className="text-[11px] text-[#011b53]/60">
                      Talla {SIZE_LABEL[it.size] ?? it.size} · ${it.unitPrice}
                    </span>

                    <div className="mt-1 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-[rgba(1,27,83,0.18)] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(it.variantId, it.quantity - 1)}
                          className="grid size-7 place-items-center text-[#011b53] hover:bg-[rgba(1,27,83,0.05)]"
                          aria-label="Reducir"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="grid size-7 place-items-center text-xs font-semibold tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(it.variantId, it.quantity + 1)}
                          className="grid size-7 place-items-center text-[#011b53] hover:bg-[rgba(1,27,83,0.05)]"
                          aria-label="Aumentar"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.variantId)}
                        className="grid size-7 place-items-center rounded-md text-rose-600 hover:bg-rose-500/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="font-display text-base tabular-nums">
                    ${(it.unitPrice * it.quantity).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-[rgba(1,27,83,0.12)] bg-[#f1e7c5]/60 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#011b53]/75">
                  Subtotal
                </span>
                <span className="font-display text-2xl tabular-nums text-[#011b53]">
                  ${totals.subtotal.toFixed(0)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#011b53]/55">
                El envío se calcula al ingresar tu dirección.
              </p>

              <Link
                href="/checkout"
                onClick={onClose}
                className="group mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#011b53] text-sm font-semibold text-[#efd9a3] shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Continuar al checkout
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button
                type="button"
                onClick={clear}
                className="mt-2 w-full text-center text-[11px] font-medium text-[#011b53]/55 underline-offset-4 hover:text-[#011b53] hover:underline"
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
