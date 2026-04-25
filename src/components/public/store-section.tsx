"use client"

import * as React from "react"
import { ProductCardCart } from "./product-card-cart"
import { cn } from "@/lib/utils"
import type { PublicProduct } from "@/lib/queries/public-products"

type CategoryKey = "all" | "clubes" | "selecciones" | "retro" | "nba"

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "Todo" },
  { key: "clubes", label: "Clubes" },
  { key: "selecciones", label: "Selecciones" },
  { key: "retro", label: "Retro" },
  { key: "nba", label: "NBA" },
]

const CLUB_TEAMS = new Set([
  "FC Barcelona",
  "Real Madrid",
  "Juventus",
  "AC Milan",
  "Paris Saint-Germain",
  "Málaga",
])
const NATIONAL_TEAMS = new Set([
  "Argentina",
  "Brasil",
  "Francia",
  "España",
  "Italia",
  "Portugal",
  "Cuba",
  "Alemania",
])

function inCategory(p: PublicProduct, c: CategoryKey): boolean {
  if (c === "all") return true
  if (c === "retro") return p.versionType === "retro"
  if (c === "nba") return p.league === "NBA"
  if (c === "clubes") return p.team !== null && CLUB_TEAMS.has(p.team)
  if (c === "selecciones") return p.team !== null && NATIONAL_TEAMS.has(p.team)
  return false
}

const FEATURED_LIMIT = 8

export function StoreSection({ products }: { products: PublicProduct[] }) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>("all")

  const featured = React.useMemo(
    () => products.filter((p) => p.featured).slice(0, FEATURED_LIMIT),
    [products]
  )
  const filteredAll = React.useMemo(
    () => products.filter((p) => inCategory(p, activeCategory)),
    [products, activeCategory]
  )
  const featuredIds = new Set(featured.map((p) => p.id))
  const restAll = filteredAll.filter((p) => !featuredIds.has(p.id))
  const showFeaturedRow = activeCategory === "all" && featured.length > 0
  const showRest =
    activeCategory !== "all" || filteredAll.length > FEATURED_LIMIT

  return (
    <section
      id="tienda"
      className="relative bg-[#f7ebc8] py-14 md:py-20"
      style={{ color: "#011b53" }}
    >
      {/* Subtle dot backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#980e21]">
            Tienda
          </span>
          <h2 className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
            Elige talla,{" "}
            <span className="text-[#980e21]">agrega al carrito</span>
            <br />y paga por WhatsApp.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-[#011b53]/75 md:text-base">
            Cada pedido te llega a Cuba — La Habana, Matanzas, Pinar, Mayabeque o
            Artemisa. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Categorías"
        >
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.key
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(c.key)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                    : "border-[rgba(1,27,83,0.18)] bg-white/70 text-[#011b53] hover:border-[#011b53]/60"
                )}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Featured of the week (only on All tab) */}
        {showFeaturedRow ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCardCart key={p.id} product={p} />
              ))}
            </div>

            {showRest && (
              <>
                <div className="mt-12 mb-4 flex items-baseline gap-3">
                  <h3 className="font-display text-2xl tracking-tight md:text-3xl">
                    Catálogo completo
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-wider text-[#011b53]/55">
                    {restAll.length} más
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
                  {restAll.map((p) => (
                    <ProductCardCart key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filteredAll.length === 0 ? (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-12 text-center text-sm text-[#011b53]/65">
                No hay productos en esta categoría todavía.
              </div>
            ) : (
              filteredAll.map((p) => (
                <ProductCardCart key={p.id} product={p} />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}
