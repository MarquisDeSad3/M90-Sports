"use client"

import * as React from "react"
import { Package, Search, X } from "lucide-react"
import { ProductTile } from "@/components/public/product-tile"
import { cn } from "@/lib/utils"
import type { PublicProduct } from "@/lib/queries/public-products"

interface Props {
  products: PublicProduct[]
}

const QUICK_FILTERS = [
  { id: "all", label: "Todo" },
  { id: "club", label: "Clubes" },
  { id: "national", label: "Selecciones" },
  { id: "retro", label: "Retro" },
  { id: "nba", label: "NBA" },
] as const

type FilterId = (typeof QUICK_FILTERS)[number]["id"]

const NATIONAL_TEAMS = new Set([
  "Argentina",
  "Brasil",
  "Brazil",
  "Francia",
  "France",
  "España",
  "Spain",
  "Portugal",
  "Alemania",
  "Germany",
  "Italia",
  "Italy",
  "Cuba",
  "Mexico",
  "México",
  "Holanda",
  "Netherlands",
  "Inglaterra",
  "England",
])

function matchesFilter(p: PublicProduct, f: FilterId): boolean {
  if (f === "all") return true
  if (f === "retro") return p.versionType === "retro"
  if (f === "nba") return p.league === "NBA"
  if (f === "national") return p.team !== null && NATIONAL_TEAMS.has(p.team)
  if (f === "club")
    return (
      p.team !== null && !NATIONAL_TEAMS.has(p.team) && p.league !== "NBA"
    )
  return true
}

export function TiendaCatalog({ products }: Props) {
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterId>("all")

  const filtered = React.useMemo(() => {
    let arr = products
    if (filter !== "all") {
      arr = arr.filter((p) => matchesFilter(p, filter))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      arr = arr.filter((p) =>
        [p.name, p.team ?? "", p.player ?? "", p.season ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    }
    return arr
  }, [products, filter, search])

  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 px-6 py-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-[rgba(1,27,83,0.08)]">
            <Package className="size-5 text-[#011b53]/60" />
          </div>
          <h2 className="text-lg font-semibold text-[#011b53]">
            Catálogo en preparación
          </h2>
          <p className="max-w-sm text-sm text-[#011b53]/65">
            Estamos trayendo los jerseys ahora mismo. Vuelve pronto o
            escríbenos por WhatsApp para pedir uno específico.
          </p>
          <a
            href="https://wa.me/5363285022?text=Hola%20M90%2C%20quiero%20saber%20cuándo%20añaden%20más%20productos"
            target="_blank"
            rel="noopener"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-xs font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
          >
            <Search className="size-3.5" />
            Pídelo por WhatsApp
          </a>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Sticky filter strip */}
      <section className="sticky top-[64px] z-20 mx-auto max-w-6xl bg-[#f7ebc8]/90 px-5 py-3 backdrop-blur md:top-[72px] md:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#011b53]/55" />
          <input
            type="search"
            placeholder="Buscar equipo, jugador, temporada…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-[rgba(1,27,83,0.18)] bg-white/85 pl-11 pr-10 text-sm font-medium text-[#011b53] placeholder:text-[#011b53]/45 focus:border-[#011b53] focus:outline-none focus:ring-2 focus:ring-[#011b53]/15"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[#011b53]/65 transition-colors hover:bg-[#011b53]/10 hover:text-[#011b53]"
              aria-label="Limpiar"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK_FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                    : "border-[rgba(1,27,83,0.18)] bg-white/70 text-[#011b53] hover:border-[#011b53]/60",
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Result count */}
      <section className="mx-auto max-w-6xl px-5 pt-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/55 tabular-nums">
          {filtered.length === products.length
            ? `${products.length} ${products.length === 1 ? "producto" : "productos"}`
            : `${filtered.length} de ${products.length} productos`}
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-5 py-4 pb-20 md:px-8">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-12 text-center">
            <Search className="size-7 text-[#011b53]/40" />
            <p className="text-sm text-[#011b53]/65">
              {search
                ? `Sin resultados para "${search}"`
                : "Sin productos en esta categoría todavía."}
            </p>
            <a
              href={`https://wa.me/5363285022?text=${encodeURIComponent(
                search
                  ? `Hola M90, ¿tienen "${search}"?`
                  : "Hola M90, ¿qué pueden conseguirme?",
              )}`}
              target="_blank"
              rel="noopener"
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Pregúntalo por WhatsApp
            </a>
          </div>
        )}
      </section>
    </>
  )
}
