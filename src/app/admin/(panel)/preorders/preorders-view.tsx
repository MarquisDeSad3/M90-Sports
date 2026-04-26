"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Search, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProductImage } from "@/components/admin/product-image"
import { ProductStatusBadge } from "@/components/admin/product-status-badge"
import { cn } from "@/lib/utils"
import type { MockProduct } from "@/lib/mock-data"

interface Section {
  id: string
  name: string
  products: MockProduct[]
}

interface PreordersViewProps {
  sections: Section[]
  totalProducts: number
}

/**
 * Collapsible-by-section list of preorder products. Each section is
 * a category (Selecciones, Clubes, NBA, ...) with a grid of product
 * cards inside. Clicking a card opens the regular product editor so
 * the existing flow (price, photos, publish) still works unchanged.
 */
export function PreordersView({ sections, totalProducts }: PreordersViewProps) {
  const [search, setSearch] = React.useState("")
  // All sections start expanded so Ever sees the whole catalog at once.
  // Click a header to collapse a section (state persists per session).
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  const filteredSections = React.useMemo(() => {
    if (!search.trim()) return sections
    const q = search.trim().toLowerCase()
    return sections.map((s) => ({
      ...s,
      products: s.products.filter((p) =>
        [p.name, p.team, p.player ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      ),
    }))
  }, [sections, search])

  const totalFiltered = filteredSections.reduce((s, x) => s + x.products.length, 0)

  function toggle(id: string) {
    setCollapsed((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto, equipo o jugador…"
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {search ? (
              <>
                {totalFiltered} de {totalProducts} productos
              </>
            ) : (
              <>{totalProducts} productos</>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {filteredSections.map((section) => {
        if (section.products.length === 0) return null
        const isCollapsed = collapsed.has(section.id)
        return (
          <SectionBlock
            key={section.id}
            section={section}
            collapsed={isCollapsed}
            onToggle={() => toggle(section.id)}
          />
        )
      })}

      {totalFiltered === 0 && search && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Sin resultados para &ldquo;{search}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * One collapsible category block. Paginates its own product list
 * (12/page) so a section with 200+ items doesn't dump everything at
 * once. The toggle reveals the grid; pagination state survives the
 * collapse so reopening shows the same page the user left.
 */
function SectionBlock({
  section,
  collapsed,
  onToggle,
}: {
  section: Section
  collapsed: boolean
  onToggle: () => void
}) {
  const PAGE_SIZE = 12
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(section.products.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const items = section.products.slice(start, start + PAGE_SIZE)

  // If the products list shrinks (search filter), snap back to page 1.
  React.useEffect(() => {
    setPage(1)
  }, [section.products.length])

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-4 py-2.5 text-left transition-colors hover:bg-muted/60"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">{section.name}</h3>
          <Badge variant="secondary" className="tabular-nums">
            {section.products.length}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            collapsed ? "" : "rotate-180",
          )}
        />
      </button>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {section.products.length > PAGE_SIZE && (
            <SectionPager
              page={current}
              totalPages={totalPages}
              onChange={setPage}
              from={start + 1}
              to={Math.min(start + PAGE_SIZE, section.products.length)}
              total={section.products.length}
            />
          )}
        </>
      )}
    </section>
  )
}

function SectionPager({
  page,
  totalPages,
  onChange,
  from,
  to,
  total,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  from: number
  to: number
  total: number
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={cn(
            "rounded border px-2.5 py-1 transition-colors",
            page <= 1
              ? "cursor-not-allowed border-border/40 text-muted-foreground/50"
              : "border-border hover:bg-accent",
          )}
        >
          ‹
        </button>
        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={cn(
            "rounded border px-2.5 py-1 transition-colors",
            page >= totalPages
              ? "cursor-not-allowed border-border/40 text-muted-foreground/50"
              : "border-border hover:bg-accent",
          )}
        >
          ›
        </button>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: MockProduct }) {
  return (
    <Link
      href={`/admin/products/${product.id}`}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-2 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <ProductImage
          team={product.team || "M90"}
          number={product.number}
          imageUrl={product.primaryImage}
          size="lg"
          className="size-full"
        />
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <span className="line-clamp-2 text-xs font-medium leading-tight">
          {product.name}
        </span>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold tabular-nums text-foreground">
            ${product.basePrice}
          </span>
          <ProductStatusBadge status={product.status} />
        </div>
      </div>
    </Link>
  )
}
