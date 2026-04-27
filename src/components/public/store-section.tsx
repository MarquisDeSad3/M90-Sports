"use client"

import * as React from "react"
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

  // Identify the "Por encargo" parent (if it exists). Active when its
  // tab is the selected one — we then show every isPreorder product
  // regardless of which subcategory it belongs to.
  const preorderParent = React.useMemo(
    () => categories.find((c) => c.slug === "por-encargo") ?? null,
    [categories],
  )
  const isPreorderTab =
    preorderParent !== null && activeId === preorderParent.id

  // Featured row: never includes preorder products — they belong in
  // their own tab so the front page stays focused on what's in stock.
  const featured = React.useMemo(
    () =>
      products
        .filter((p) => p.featured && !p.isPreorder)
        .slice(0, FEATURED_LIMIT),
    [products],
  )

  const filteredAll = React.useMemo(() => {
    if (isPreorderTab) return products.filter((p) => p.isPreorder)
    if (activeId === ALL_TAB.id) return products.filter((p) => !p.isPreorder)
    return products.filter(
      (p) => !p.isPreorder && p.categoryIds.includes(activeId),
    )
  }, [products, activeId, isPreorderTab])

  const featuredIds = new Set(featured.map((p) => p.id))
  const restAll = filteredAll.filter((p) => !featuredIds.has(p.id))
  const showFeaturedRow = activeId === ALL_TAB.id && featured.length > 0
  const showRest = activeId !== ALL_TAB.id || filteredAll.length > FEATURED_LIMIT

  // Tab list: "Todo" first, then top-level categories (parentId IS NULL)
  // in configured order. Subcategories of "Por encargo" are hidden —
  // they live under that single tab so the storefront stays clean.
  const tabs: Array<{ id: string; label: string }> = [
    { id: ALL_TAB.id, label: ALL_TAB.label },
    ...categories
      .filter((c) => c.parentId === null)
      .filter((c) => {
        // "Por encargo" parent has no products of its own, but it's
        // valid as long as ANY product has isPreorder=true.
        if (c.slug === "por-encargo") {
          return products.some((p) => p.isPreorder)
        }
        return products.some(
          (p) => !p.isPreorder && p.categoryIds.includes(c.id),
        )
      })
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
