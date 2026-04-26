"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductImage } from "@/components/admin/product-image"
import { ProductStatusBadge } from "@/components/admin/product-status-badge"
import { cn } from "@/lib/utils"
import type { MockProduct } from "@/lib/mock-data"
import { bulkAssignCategoryAction } from "./actions"

interface Chip {
  id: string
  name: string
  count: number
}

interface PreordersViewProps {
  products: MockProduct[]
  chips: Chip[]
  categories: { id: string; name: string }[]
}

const PAGE_SIZE = 30

export function PreordersView({
  products,
  chips,
  categories,
}: PreordersViewProps) {
  const router = useRouter()
  const [filter, setFilter] = React.useState<string>("all")
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [targetCategoryId, setTargetCategoryId] = React.useState<string>("")
  const [mode, setMode] = React.useState<"add" | "move">("add")
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  // Reset to page 1 whenever the visible set changes.
  React.useEffect(() => {
    setPage(1)
  }, [filter, search])

  const filtered = React.useMemo(() => {
    let arr = products
    if (filter === "uncategorized") {
      const encargoIds = new Set(chips.filter((c) => c.id !== "uncategorized").map((c) => c.id))
      arr = arr.filter((p) => !p.categories.some((cid) => encargoIds.has(cid)))
    } else if (filter !== "all") {
      arr = arr.filter((p) => p.categories.includes(filter))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      arr = arr.filter((p) =>
        [p.name, p.team, p.player ?? "", p.season ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    }
    return arr
  }, [products, filter, search, chips])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)
  const totalAll = chips.reduce((sum, c) => sum + (c.id === "uncategorized" ? c.count : 0), 0)
  const totalProducts = products.length

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAllVisible() {
    setSelected((cur) => {
      const next = new Set(cur)
      const allSelected = visible.every((p) => next.has(p.id))
      if (allSelected) {
        for (const p of visible) next.delete(p.id)
      } else {
        for (const p of visible) next.add(p.id)
      }
      return next
    })
  }
  function clearSelection() {
    setSelected(new Set())
  }

  function handleBulk() {
    if (selected.size === 0 || !targetCategoryId) return
    setFeedback(null)
    const ids = Array.from(selected)
    const targetName =
      categories.find((c) => c.id === targetCategoryId)?.name ?? "la colección"
    startTransition(async () => {
      const res = await bulkAssignCategoryAction(ids, targetCategoryId, mode)
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text: `${res.count} producto${res.count === 1 ? "" : "s"} ${
            mode === "move" ? "movidos" : "agregados"
          } a "${targetName}".`,
        })
        clearSelection()
        router.refresh()
      } else {
        setFeedback({ kind: "err", text: res.error })
      }
    })
  }

  void totalAll

  return (
    <div className="flex flex-col gap-4">
      {/* Top: search + chip filters */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="flex flex-col gap-3 p-0">
          {/* Search */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, equipo, jugador, temporada…"
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
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {filtered.length === totalProducts
                ? `${totalProducts} productos`
                : `${filtered.length} de ${totalProducts} productos`}
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <ChipButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="Todos"
              count={totalProducts}
            />
            {chips.map((c) => (
              <ChipButton
                key={c.id}
                active={filter === c.id}
                onClick={() => setFilter(c.id)}
                label={c.name}
                count={c.count}
                tone={c.id === "uncategorized" ? "warn" : "default"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sticky bulk-action bar (visible when something is selected) */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/95 p-3 text-primary-foreground shadow-lg backdrop-blur">
          <CheckCheck className="size-4" />
          <span className="text-sm font-semibold tabular-nums">
            {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger className="h-9 w-[200px] border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20">
                <SelectValue placeholder="Mover a colección…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("add")}
                className={cn(
                  "rounded-md px-2 py-1 transition-colors",
                  mode === "add"
                    ? "bg-white text-primary"
                    : "text-primary-foreground/80 hover:text-primary-foreground",
                )}
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setMode("move")}
                className={cn(
                  "rounded-md px-2 py-1 transition-colors",
                  mode === "move"
                    ? "bg-white text-primary"
                    : "text-primary-foreground/80 hover:text-primary-foreground",
                )}
              >
                Mover
              </button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={!targetCategoryId || pending}
              onClick={handleBulk}
              className="h-9"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Aplicando…
                </>
              ) : (
                "Aplicar"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-9 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            feedback.kind === "ok"
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-900 ring-1 ring-rose-200",
          )}
          role="status"
        >
          {feedback.text}
        </div>
      )}

      {/* Select-all toggle */}
      {visible.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={toggleAllVisible}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={visible.every((p) => selected.has(p.id))}
              tabIndex={-1}
              className="pointer-events-none"
            />
            Seleccionar página ({visible.length})
          </button>
        </div>
      )}

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              selected={selected.has(p.id)}
              onToggleSelect={() => toggle(p.id)}
              selectionMode={selected.size > 0}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Sparkles className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search
                ? `Sin resultados para "${search}"`
                : "No hay productos en esta colección."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <Pagination
          page={current}
          totalPages={totalPages}
          onChange={setPage}
          from={start + 1}
          to={Math.min(start + PAGE_SIZE, filtered.length)}
          total={filtered.length}
        />
      )}
    </div>
  )
}

function ChipButton({
  active,
  onClick,
  label,
  count,
  tone = "default",
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  tone?: "default" | "warn"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : tone === "warn"
            ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
            : "bg-muted/60 text-foreground hover:bg-muted",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          active
            ? "bg-white/20 text-primary-foreground"
            : tone === "warn"
              ? "bg-amber-200/60 text-amber-900"
              : "bg-foreground/10 text-foreground/70",
        )}
      >
        {count}
      </span>
    </button>
  )
}

function ProductCard({
  product,
  selected,
  onToggleSelect,
  selectionMode,
}: {
  product: MockProduct
  selected: boolean
  onToggleSelect: () => void
  selectionMode: boolean
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-2 transition-all",
        selected
          ? "border-primary ring-2 ring-primary/30 shadow-md"
          : "hover:border-primary/40 hover:shadow-md",
      )}
    >
      {/* Checkbox overlay (always shown on hover; visible while selecting) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onToggleSelect()
        }}
        className={cn(
          "absolute left-3 top-3 z-10 grid size-6 place-items-center rounded-md border bg-card/95 shadow transition-opacity",
          selected || selectionMode
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
        aria-label={selected ? "Deseleccionar" : "Seleccionar"}
      >
        <Checkbox checked={selected} tabIndex={-1} className="pointer-events-none" />
      </button>

      <Link
        href={`/admin/products/${product.id}`}
        className="flex flex-col gap-2"
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
            <span
              className={cn(
                "font-semibold tabular-nums",
                product.basePrice === 0
                  ? "text-amber-700"
                  : "text-foreground",
              )}
            >
              {product.basePrice === 0 ? "Sin precio" : `$${product.basePrice}`}
            </span>
            <ProductStatusBadge status={product.status} />
          </div>
        </div>
      </Link>
    </div>
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
    <div className="flex flex-col items-center justify-between gap-2 px-1 text-xs text-muted-foreground sm:flex-row">
      <span className="tabular-nums">
        Mostrando <span className="font-medium text-foreground">{from}–{to}</span> de{" "}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageButton
          disabled={page <= 1}
          onClick={() => onChange(1)}
          aria-label="Primera página"
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
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/50">
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
          aria-label="Última página"
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
        "inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-xs transition-colors tabular-nums",
        disabled
          ? "cursor-not-allowed border-border/40 text-muted-foreground/40"
          : active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card hover:bg-accent",
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
