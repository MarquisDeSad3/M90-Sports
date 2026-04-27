"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackagePlus,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ProductImage } from "@/components/admin/product-image"
import { cn } from "@/lib/utils"
import {
  bulkAssignFromPickerAction,
  searchProductsForPickerAction,
  type PickerKind,
  type PickerProduct,
} from "@/app/admin/(panel)/products/actions"

const PAGE_SIZE = 30

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetCategoryId: string
  targetCategoryName: string
}

export function PreorderPickerDialog({
  open,
  onOpenChange,
  targetCategoryId,
  targetCategoryName,
}: Props) {
  const router = useRouter()
  const [kind, setKind] = React.useState<PickerKind>("both")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [results, setResults] = React.useState<PickerProduct[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  // Reset on close.
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setDebouncedSearch("")
      setKind("both")
      setPage(1)
      setSelected(new Set())
      setResults([])
      setTotal(0)
      setFeedback(null)
    }
  }, [open])

  // Debounce search → 300ms after the last keystroke we update
  // `debouncedSearch` which triggers the actual fetch.
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [search])

  // Fetch on open / search / kind / page change.
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    void searchProductsForPickerAction({
      search: debouncedSearch,
      kind,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }).then((res) => {
      if (cancelled) return
      if (res.ok) {
        setResults(res.products)
        setTotal(res.total)
      } else {
        setResults([])
        setTotal(0)
        setFeedback({ kind: "err", text: res.error })
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, debouncedSearch, kind, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleVisible() {
    setSelected((cur) => {
      const next = new Set(cur)
      const allSelected =
        results.length > 0 && results.every((p) => next.has(p.id))
      if (allSelected) {
        for (const p of results) next.delete(p.id)
      } else {
        for (const p of results) next.add(p.id)
      }
      return next
    })
  }

  function handleApply() {
    if (selected.size === 0) return
    setFeedback(null)
    const ids = Array.from(selected)
    startTransition(async () => {
      const res = await bulkAssignFromPickerAction(ids, targetCategoryId)
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text: `${ids.length} producto${ids.length === 1 ? "" : "s"} asignado${
            ids.length === 1 ? "" : "s"
          } a ${targetCategoryName}.`,
        })
        setSelected(new Set())
        router.refresh()
        window.setTimeout(() => onOpenChange(false), 900)
      } else {
        setFeedback({ kind: "err", text: res.error })
      }
    })
  }

  // Count selected by kind for the apply button label.
  const selectedKindCount = React.useMemo(() => {
    let preorder = 0
    let inStock = 0
    for (const p of results) {
      if (selected.has(p.id)) {
        if (p.isPreorder) preorder += 1
        else inStock += 1
      }
    }
    return { preorder, inStock, total: selected.size }
  }, [results, selected])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <PackagePlus className="size-4 text-primary" />
            Agregar a {targetCategoryName}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Selecciona productos del catálogo o del pool de Por encargo. Los de
            por encargo pasan automáticamente a publicados.
          </SheetDescription>
        </SheetHeader>

        {/* Kind toggle */}
        <div className="border-b px-4 pt-3 pb-2">
          <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
            <KindButton
              active={kind === "both"}
              onClick={() => {
                setKind("both")
                setPage(1)
              }}
            >
              Todos
            </KindButton>
            <KindButton
              active={kind === "in_stock"}
              onClick={() => {
                setKind("in_stock")
                setPage(1)
              }}
            >
              En stock
            </KindButton>
            <KindButton
              active={kind === "preorder"}
              onClick={() => {
                setKind("preorder")
                setPage(1)
              }}
            >
              Por encargo
            </KindButton>
          </div>
        </div>

        {/* Search */}
        <div className="border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre, equipo, jugador, slug…"
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {loading ? (
              <Loader2 className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={toggleVisible}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={results.length === 0}
            >
              <Checkbox
                checked={
                  results.length > 0 && results.every((p) => selected.has(p.id))
                }
                tabIndex={-1}
                className="pointer-events-none"
              />
              Seleccionar página ({results.length})
            </button>
            <span className="tabular-nums">
              {total === 0
                ? "0 resultados"
                : `${start + 1}–${Math.min(start + PAGE_SIZE, total)} de ${total.toLocaleString("es-CU")}`}
            </span>
          </div>
        </div>

        {/* List */}
        <div
          className={cn(
            "flex-1 overflow-y-auto p-3",
            loading && "opacity-70 transition-opacity",
          )}
        >
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Search className="size-7 opacity-40" />
              {debouncedSearch
                ? `Sin resultados para "${debouncedSearch}"`
                : "El catálogo está vacío para este filtro."}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {results.map((p) => {
                const isSelected = selected.has(p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "hover:border-primary/40",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none shrink-0"
                      />
                      <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <ProductImage
                          team={p.team || "M90"}
                          imageUrl={p.primaryImageUrl}
                          size="md"
                          className="size-full"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="line-clamp-2 text-xs font-medium leading-tight">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-muted-foreground tabular-nums">
                            {p.basePrice === 0 ? "Sin precio" : `$${p.basePrice}`}
                          </span>
                          {p.team && (
                            <span className="truncate text-muted-foreground">
                              · {p.team}
                            </span>
                          )}
                          {p.isPreorder ? (
                            <Badge
                              variant="outline"
                              className="ml-auto h-4 border-amber-300 bg-amber-50 px-1 text-[9px] text-amber-900"
                            >
                              Por encargo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="ml-auto h-4 border-emerald-300 bg-emerald-50 px-1 text-[9px] text-emerald-900"
                            >
                              En stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded border px-2 transition-colors",
                  page <= 1 || loading
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "hover:bg-accent",
                )}
              >
                <ChevronLeft className="size-3.5" />
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded border px-2 transition-colors",
                  page >= totalPages || loading
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "hover:bg-accent",
                )}
              >
                Siguiente
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className={cn(
              "border-t px-4 py-2 text-sm",
              feedback.kind === "ok"
                ? "bg-emerald-50 text-emerald-900"
                : "bg-rose-50 text-rose-900",
            )}
          >
            {feedback.text}
          </div>
        )}

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t p-4 sm:justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {selected.size === 0
              ? "Selecciona al menos uno"
              : selectedKindCount.preorder > 0 &&
                  selectedKindCount.inStock > 0
                ? `${selectedKindCount.total} (${selectedKindCount.preorder} por encargo + ${selectedKindCount.inStock} en stock)`
                : selectedKindCount.preorder > 0
                  ? `${selectedKindCount.preorder} por encargo · pasarán a publicados`
                  : `${selectedKindCount.inStock} en stock`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={handleApply}
              className="gap-1.5"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PackagePlus className="size-3.5" />
              )}
              Asignar a {targetCategoryName}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function KindButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded px-3 py-1.5 text-center font-semibold transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
