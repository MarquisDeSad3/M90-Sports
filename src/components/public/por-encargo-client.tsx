"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  PublicPreorderProduct,
  PublicPreorderSubcategory,
} from "@/lib/queries/public-preorders"

interface Props {
  products: PublicPreorderProduct[]
  subcategories: PublicPreorderSubcategory[]
}

const PAGE_SIZE = 30

export function PorEncargoClient({ products, subcategories }: Props) {
  const [filter, setFilter] = React.useState<string>("all")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    setPage(1)
  }, [filter, search])

  const filtered = React.useMemo(() => {
    let arr = products
    if (filter !== "all") {
      arr = arr.filter((p) => p.categoryIds.includes(filter))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      arr = arr.filter((p) =>
        [p.name, p.team ?? ""].join(" ").toLowerCase().includes(q),
      )
    }
    return arr
  }, [products, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  return (
    <>
      {/* Sticky filter bar */}
      <section className="sticky top-[64px] z-20 mx-auto max-w-6xl bg-[#f7ebc8]/90 px-5 py-3 backdrop-blur md:top-[72px] md:px-8">
        {/* Search */}
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

        {/* Subcategory chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <ChipButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Todos"
            count={products.length}
          />
          {subcategories
            .filter((s) => s.count > 0)
            .map((s) => (
              <ChipButton
                key={s.id}
                active={filter === s.id}
                onClick={() => setFilter(s.id)}
                label={s.name}
                count={s.count}
              />
            ))}
        </div>
      </section>

      {/* Result count */}
      <section className="mx-auto max-w-6xl px-5 pt-4 md:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/55 tabular-nums">
          {filtered.length === products.length
            ? `${products.length.toLocaleString("es-CU")} productos`
            : `${filtered.length.toLocaleString("es-CU")} de ${products.length.toLocaleString("es-CU")} productos`}
        </p>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-5 py-4 md:px-8">
        {visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {visible.map((p) => (
              <PreorderCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-12 text-center">
            <Search className="size-7 text-[#011b53]/40" />
            <p className="text-sm text-[#011b53]/65">
              {search
                ? `Sin resultados para "${search}"`
                : "No hay productos en esta categoría todavía."}
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <section className="mx-auto max-w-6xl px-5 pb-6 md:px-8">
          <Pagination
            page={current}
            totalPages={totalPages}
            onChange={setPage}
            from={start + 1}
            to={Math.min(start + PAGE_SIZE, filtered.length)}
            total={filtered.length}
          />
        </section>
      )}
    </>
  )
}

function ChipButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
          : "border-[rgba(1,27,83,0.18)] bg-white/70 text-[#011b53] hover:border-[#011b53]/60",
      )}
    >
      {label}
      <span
        className={cn(
          "ml-2 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          active
            ? "bg-white/20 text-[#efd9a3]"
            : "bg-[#011b53]/8 text-[#011b53]/65",
        )}
      >
        {count}
      </span>
    </button>
  )
}

function PreorderCard({ product }: { product: PublicPreorderProduct }) {
  const needsQuote = product.basePrice === 0
  const waMessage = encodeURIComponent(
    `Hola M90, me interesa este producto: ${product.name}.\n\n¿Cuánto cuesta y cuándo llega?`,
  )

  return (
    <article className="group flex flex-col gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-[rgba(1,27,83,0.08)] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(1,27,83,0.12)]">
      <Link
        href={`/tienda/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[rgba(1,27,83,0.04)]"
      >
        {product.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs uppercase tracking-wider text-[#011b53]/30">
            Sin foto
          </div>
        )}
        {product.featured && (
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#011b53] text-[#efd9a3]">
            <Sparkles className="size-3.5" />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-[#980e21] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Por encargo
        </span>
      </Link>

      <div className="flex min-h-[28px] flex-col gap-0.5 px-1">
        {product.team && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#011b53]/55">
            {product.team}
          </span>
        )}
      </div>

      <Link href={`/tienda/${product.slug}`} className="px-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-[#011b53] hover:text-[#980e21]">
          {product.name}
        </h3>
      </Link>

      <div className="flex items-baseline gap-2 px-1">
        {needsQuote ? (
          <span className="text-sm font-semibold uppercase tracking-wider text-[#980e21]">
            Cotizar por WhatsApp
          </span>
        ) : (
          <>
            <span className="font-display text-2xl tabular-nums text-[#011b53]">
              ${product.basePrice.toFixed(0)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#011b53]/55">
              ref.
            </span>
          </>
        )}
      </div>

      <a
        href={`https://wa.me/5351191461?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-95"
      >
        <MessageCircle className="size-3.5" />
        Consultar por WhatsApp
      </a>
    </article>
  )
}

function Pagination({
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
  const pages = pageWindow(page, totalPages, 7)
  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 text-xs text-[#011b53]/70 sm:flex-row">
      <span className="tabular-nums">
        <span className="font-semibold text-[#011b53]">{from}</span>–
        <span className="font-semibold text-[#011b53]">{to}</span> de{" "}
        <span className="font-semibold text-[#011b53]">{total.toLocaleString("es-CU")}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageButton
          disabled={page <= 1}
          onClick={() => onChange(1)}
          aria-label="Primera"
        >
          <ChevronsLeft className="size-3.5" />
        </PageButton>
        <PageButton
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-3.5" />
        </PageButton>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-[#011b53]/40">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onChange(p)}
            >
              {p}
            </PageButton>
          ),
        )}
        <PageButton
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Siguiente"
        >
          <ChevronRight className="size-3.5" />
        </PageButton>
        <PageButton
          disabled={page >= totalPages}
          onClick={() => onChange(totalPages)}
          aria-label="Última"
        >
          <ChevronsRight className="size-3.5" />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ...rest
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-semibold transition-all tabular-nums",
        disabled
          ? "cursor-not-allowed border-[rgba(1,27,83,0.08)] text-[#011b53]/30"
          : active
            ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
            : "border-[rgba(1,27,83,0.18)] bg-white/70 text-[#011b53] hover:border-[#011b53]/60",
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

function pageWindow(current: number, total: number, max = 7): (number | "…")[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)
  const half = Math.floor(max / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + max - 1)
  if (end - start + 1 < max) start = Math.max(1, end - max + 1)
  const arr: (number | "…")[] = []
  if (start > 1) {
    arr.push(1)
    if (start > 2) arr.push("…")
  }
  for (let i = start; i <= end; i++) arr.push(i)
  if (end < total) {
    if (end < total - 1) arr.push("…")
    arr.push(total)
  }
  return arr
}
