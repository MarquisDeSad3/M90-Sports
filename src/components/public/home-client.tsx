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

export function HomeClient({ products }: { products: PublicProduct[] }) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>("all")

  const featured = React.useMemo(
    () => products.filter((p) => p.featured).slice(0, FEATURED_LIMIT),
    [products]
  )

  const filteredAll = React.useMemo(
    () => products.filter((p) => inCategory(p, activeCategory)),
    [products, activeCategory]
  )

  // The "rest" — everything not already shown as featured (deduplicated by id)
  const featuredIds = new Set(featured.map((p) => p.id))
  const restAll = filteredAll.filter((p) => !featuredIds.has(p.id))
  const showRest =
    activeCategory !== "all" || filteredAll.length > FEATURED_LIMIT

  // For "all" tab, the rest is everything beyond the 8 featured.
  // For category tabs, we show all matching products (no featured row).
  const showFeaturedRow = activeCategory === "all" && featured.length > 0

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-6 md:px-8 md:pt-16">
        <div className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(1,27,83,0.15)] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#011b53]/75">
            Tienda M90 Sports
          </span>
          <h1 className="font-display text-4xl leading-[0.95] tracking-tight text-[#011b53] md:text-6xl">
            Jerseys que
            <br />
            <span className="text-[#980e21]">cuentan historias</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#011b53]/75 md:text-base">
            Pídelos por WhatsApp y los enviamos a toda Cuba — La Habana, Matanzas,
            Pinar del Río, Mayabeque y Artemisa. Pago por Zelle, PayPal
            o efectivo a la entrega.
          </p>
        </div>
      </section>

      {/* Featured-of-the-week section */}
      {showFeaturedRow && (
        <section className="mx-auto max-w-6xl px-5 pt-4 md:px-8">
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-tight text-[#011b53] md:text-3xl">
                Destacados de la semana
              </h2>
              <p className="text-sm text-[#011b53]/70">
                Lo que se está yendo volando. Elige talla, agrega al carrito y cuando
                termines mandas tu pedido completo por WhatsApp.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Category tabs */}
      <section className="sticky top-[64px] z-20 mx-auto max-w-6xl bg-[#f7ebc8]/85 px-5 py-3 backdrop-blur md:top-[72px] md:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.key
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                onClick={() => setActiveCategory(c.key)}
                aria-selected={active}
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
      </section>

      {/* Featured row OR filtered grid */}
      <section className="mx-auto max-w-6xl px-5 pb-6 md:px-8">
        {showFeaturedRow ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCardCart key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filteredAll.map((p) => (
              <ProductCardCart key={p.id} product={p} />
            ))}
            {filteredAll.length === 0 && (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-12 text-center text-sm text-[#011b53]/65">
                No hay productos en esta categoría todavía.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Full catalog only on "all" tab and only if there are more than the featured */}
      {showFeaturedRow && showRest && (
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="font-display text-2xl tracking-tight text-[#011b53] md:text-3xl">
              Catálogo completo
            </h2>
            <span className="text-xs font-medium uppercase tracking-wider text-[#011b53]/55">
              {restAll.length} más
            </span>
          </div>
          <p className="mb-5 text-xs text-[#011b53]/60">
            Estás viendo los {Math.min(featured.length, FEATURED_LIMIT)} destacados arriba. Aquí está el resto.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {restAll.map((p) => (
              <ProductCardCart key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
