"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ProductCardCart } from "./product-card-cart"
import { cn } from "@/lib/utils"
import type {
  PublicCategory,
  PublicProduct,
} from "@/lib/queries/public-products"

const FEATURED_LIMIT = 8

/**
 * Special pseudo-tab that always shows every product. We render it as
 * the first option regardless of how many DB categories exist — "Todo"
 * is the catalog overview, not a category in the schema.
 */
const ALL_TAB = { id: "__all__", label: "Todo" } as const

export function StoreSection({
  products,
  categories,
}: {
  products: PublicProduct[]
  categories: PublicCategory[]
}) {
  const [activeId, setActiveId] = React.useState<string>(ALL_TAB.id)

  // "Por encargo" lives on its own page (/por-encargo) — clicking the
  // tab navigates instead of filtering. We render it as a link below.
  const preorderParent = React.useMemo(
    () => categories.find((c) => c.slug === "por-encargo") ?? null,
    [categories],
  )

  const featured = React.useMemo(
    () => products.filter((p) => p.featured).slice(0, FEATURED_LIMIT),
    [products],
  )

  const filteredAll = React.useMemo(() => {
    if (activeId === ALL_TAB.id) return products
    return products.filter((p) => p.categoryIds.includes(activeId))
  }, [products, activeId])

  const featuredIds = new Set(featured.map((p) => p.id))
  const restAll = filteredAll.filter((p) => !featuredIds.has(p.id))
  const showFeaturedRow = activeId === ALL_TAB.id && featured.length > 0
  const showRest = activeId !== ALL_TAB.id || filteredAll.length > FEATURED_LIMIT

  // Inline tabs: "Todo" + top-level catalog categories that have
  // products. Excludes the "Por encargo" parent — that tab is rendered
  // separately as a link to /por-encargo.
  const tabs: Array<{ id: string; label: string }> = [
    { id: ALL_TAB.id, label: ALL_TAB.label },
    ...categories
      .filter((c) => c.parentId === null && c.slug !== "por-encargo")
      .filter((c) => products.some((p) => p.categoryIds.includes(c.id)))
      .map((c) => ({ id: c.id, label: c.name })),
  ]

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
            Cada pedido te llega a las 16 provincias de Cuba con seguimiento.
            Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Categorías"
        >
          {tabs.map((t) => {
            const active = activeId === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                    : "border-[rgba(1,27,83,0.18)] bg-white/70 text-[#011b53] hover:border-[#011b53]/60",
                )}
              >
                {t.label}
              </button>
            )
          })}
          {/* Standalone link — sends visitors to the dedicated preorder
              catalog instead of filtering inline. Visually distinct so
              it reads as "explore more" rather than another local tab. */}
          {preorderParent && (
            <Link
              href="/por-encargo"
              className="group/poe inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#980e21]/60 bg-white/40 px-4 py-2 text-sm font-semibold text-[#980e21] transition-all hover:-translate-y-0.5 hover:border-[#980e21] hover:bg-white/80"
            >
              {preorderParent.name}
              <ArrowUpRight className="size-3.5 transition-transform group-hover/poe:rotate-12" />
            </Link>
          )}
        </div>

        {/* Featured row (only on "Todo") */}
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
