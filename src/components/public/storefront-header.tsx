"use client"

import * as React from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "@/lib/cart/use-cart"

interface StorefrontHeaderProps {
  className?: string
}

export function StorefrontHeader({ className }: StorefrontHeaderProps) {
  const { totals, hydrated } = useCart()

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-[rgba(1,27,83,0.1)] bg-[#f7ebc8]/85 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/tienda"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#011b53] via-[#0a2a75] to-[#980e21] shadow-md ring-1 ring-black/5">
            <span className="font-display text-[13px] italic leading-none -translate-y-px tracking-tighter text-[#efd9a3]">
              M90
            </span>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-[-0.01em] text-[#011b53]">
              M90 Sports
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#011b53]/55">
              Tienda
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            href="/reviews"
            className="hidden text-sm font-medium text-[#011b53]/75 transition-colors hover:text-[#011b53] sm:inline-block"
          >
            Reseñas
          </Link>
          <Link
            href="/carrito"
            className="relative inline-flex items-center gap-2 rounded-full bg-[#011b53] px-4 py-2 text-sm font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Carrito</span>
            {hydrated && totals.itemCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-[#980e21] text-[10px] font-bold tabular-nums text-white">
                {totals.itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}
