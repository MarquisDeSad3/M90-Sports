"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import type { AdminPreorderRow } from "@/lib/queries/admin-preorders"
import { bulkAssignCategoryAction } from "./actions"
// Soft-delete bulk action lives with the product mutations — re-using it
// here so the preorder grid has the same behavior as /admin/products.
import { bulkDeleteProductsAction } from "@/app/admin/(panel)/products/actions"

interface Chip {
  id: string
  name: string
  count: number
}

interface Props {
  products: AdminPreorderRow[]
  total: number
  page: number
  pageSize: number
  activeCategory: string | null
  searchQuery: string
  chips: Chip[]
  categories: { id: string; name: string }[]
}

export function PreordersView({
  products,
  total,
  page,
  pageSize,
  activeCategory,
  searchQuery,
  chips,
  categories,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [navPending, startNav] = React.useTransition()
  const [bulkPending, startBulk] = React.useTransition()
  const pending = navPending || bulkPending

  // Multi-select survives pagination because router.replace keeps the
  // same client component instance — only data props change.
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [targetCategoryId, setTargetCategoryId] = React.useState<string>("")
  const [mode, setMode] = React.useState<"add" | "move">("add")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  // Search input mirror with debounce.
  const [searchInput, setSearchInput] = React.useState(searchQuery)
  const initialMount = React.useRef(true)
  React.useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])
  React.useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    const handle = window.setTimeout(() => {
      pushParams({ q: searchInput.trim() || null, page: 1 })
    }, 300)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  function pushParams(updates: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (
        value === null ||
        value === "" ||
        value === 0 ||
        value === undefined
      ) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    }
    if (next.get("page") === "1") next.delete("page")
    const qs = next.toString()
    startNav(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

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
      const allSelected = products.every((p) => next.has(p.id))
      if (allSelected) {
        for (const p of products) next.delete(p.id)
      } else {
        for (const p of products) next.add(p.id)
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
    startBulk(async () => {
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

  // Soft-delete the current selection. Same action that /admin/products
  // uses, so the products stay recoverable via the DB but disappear from
  // every public surface (catalog, sitemap, search) immediately after the
  // page refresh. The actual DB call lives in confirmBulkDelete; this
  // entry point just opens the styled dialog (no more native confirm).
  function handleBulkDelete() {
    if (selected.size === 0) return
    setFeedback(null)
    setDeleteDialogOpen(true)
  }

  function confirmBulkDelete() {
    const ids = Array.from(selected)
    startBulk(async () => {
      const res = await bulkDeleteProductsAction(ids)
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text: `${res.affected} producto${res.affected === 1 ? "" : "s"} eliminado${res.affected === 1 ? "" : "s"}.`,
        })
        clearSelection()
        setDeleteDialogOpen(false)
        router.refresh()
      } else {
        setFeedback({ kind: "err", text: res.error })
        setDeleteDialogOpen(false)
      }
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const showingFrom = total === 0 ? 0 : start + 1
  const showingTo = Math.min(start + pageSize, total)

  return (
    <div className="flex flex-col gap-4">
      {/* Top: search + chip filters */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 md:p-4">
        <CardContent className="flex flex-col gap-3 p-0">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, equipo, jugador, slug…"
                className="h-10 pl-10"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {pending ? (
                <Loader2 className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    pushParams({ q: null, page: 1 })
                  }}
                  className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {searchQuery || activeCategory
                ? `${total.toLocaleString("es-CU")} ${
                    total === 1 ? "resultado" : "resultados"
                  }`
                : `${total.toLocaleString("es-CU")} productos`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ChipButton
              active={activeCategory === null}
              onClick={() => pushParams({ cat: null, page: 1 })}
              label="Todos"
            />
            {chips.map((c) => (
              <ChipButton
                key={c.id}
                active={activeCategory === c.id}
                onClick={() => pushParams({ cat: c.id, page: 1 })}
                label={c.name}
                count={c.count}
                tone={c.id === "uncategorized" ? "warn" : "default"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/95 p-3 text-primary-foreground shadow-lg backdrop-blur">
          <CheckCheck className="size-4" />
          <span className="text-sm font-semibold tabular-nums">
            {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              value={targetCategoryId}
              onValueChange={setTargetCategoryId}
            >
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
              disabled={!targetCategoryId || bulkPending}
              onClick={handleBulk}
              className="h-9"
            >
              {bulkPending ? (
                <>
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                  Aplicando…
                </>
              ) : (
                "Aplicar"
              )}
            </Button>
            {/* Destructive option, deliberately styled to stand apart
                from the move/apply flow so it's not clicked by accident. */}
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkPending}
              onClick={handleBulkDelete}
              className="h-9 gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
            >
              <Trash2 className="size-3.5" />
              Eliminar
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

      {products.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={toggleAllVisible}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={products.every((p) => selected.has(p.id))}
              tabIndex={-1}
              className="pointer-events-none"
            />
            Seleccionar página ({products.length})
          </button>
          <span className="tabular-nums">
            {showingFrom}–{showingTo} de {total.toLocaleString("es-CU")}
          </span>
        </div>
      )}

      {products.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
            pending && "opacity-70 transition-opacity",
          )}
        >
          {products.map((p) => (
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
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : "No hay productos en esta colección."}
            </p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => pushParams({ page: p === 1 ? null : p })}
          from={showingFrom}
          to={showingTo}
          total={total}
          pending={pending}
        />
      )}

      {/* Confirm dialog for bulk soft-delete. Mounted here so it lives
          outside the bulk-actions strip and survives the strip
          unmounting when selection clears mid-action. */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        variant="destructive"
        title={`¿Eliminar ${selected.size} producto${selected.size === 1 ? "" : "s"}?`}
        description={
          <>
            Dejarán de verse en la tienda y en el sitemap inmediatamente.
            La acción es <span className="font-semibold">reversible</span>{" "}
            desde la base de datos (soft-delete via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              deleted_at
            </code>
            ).
          </>
        }
        confirmLabel="Sí, eliminar"
        pending={bulkPending}
        onConfirm={confirmBulkDelete}
      />
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
  count?: number
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
      {count !== undefined && (
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
      )}
    </button>
  )
}

function ProductCard({
  product,
  selected,
  onToggleSelect,
  selectionMode,
}: {
  product: AdminPreorderRow
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
        <Checkbox
          checked={selected}
          tabIndex={-1}
          className="pointer-events-none"
        />
      </button>

      <Link
        href={`/admin/products/${product.id}`}
        className="flex flex-col gap-2"
      >
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <ProductImage
            team={product.team || "M90"}
            number={product.number ?? undefined}
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
              {product.basePrice === 0
                ? "Sin precio"
                : `$${product.basePrice}`}
            </span>
            <ProductStatusBadge
              status={product.status as "draft" | "published" | "archived"}
            />
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
  pending,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  from: number
  to: number
  total: number
  pending: boolean
}) {
  const pages = pageWindow(page, totalPages, 7)
  return (
    <div className="flex flex-col items-center justify-between gap-2 px-1 text-xs text-muted-foreground sm:flex-row">
      <span className="tabular-nums">
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium text-foreground">
          {total.toLocaleString("es-CU")}
        </span>
      </span>
      <div className="flex items-center gap-1">
        <PageButton
          disabled={page <= 1 || pending}
          onClick={() => onChange(1)}
          aria-label="Primera"
        >
          <ChevronsLeft className="size-3.5" />
        </PageButton>
        <PageButton
          disabled={page <= 1 || pending}
          onClick={() => onChange(page - 1)}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-3.5" />
        </PageButton>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-muted-foreground/50">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              disabled={pending}
              onClick={() => onChange(p)}
            >
              {p}
            </PageButton>
          ),
        )}
        <PageButton
          disabled={page >= totalPages || pending}
          onClick={() => onChange(page + 1)}
          aria-label="Siguiente"
        >
          <ChevronRight className="size-3.5" />
        </PageButton>
        <PageButton
          disabled={page >= totalPages || pending}
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
