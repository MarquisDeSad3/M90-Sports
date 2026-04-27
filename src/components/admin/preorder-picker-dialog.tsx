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
import { ProductImage } from "@/components/admin/product-image"
import { cn } from "@/lib/utils"
import type { PreorderPickerItem } from "@/lib/queries/preorder-picker"
import { promoteFromPreorderAction } from "@/app/admin/(panel)/products/actions"

const PAGE_SIZE = 30

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: PreorderPickerItem[]
  targetCategoryId: string
  targetCategoryName: string
}

export function PreorderPickerDialog({
  open,
  onOpenChange,
  pool,
  targetCategoryId,
  targetCategoryName,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [page, setPage] = React.useState(1)
  const [pending, startTransition] = React.useTransition()
  const [feedback, setFeedback] = React.useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)

  // Reset on open / close.
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setSelected(new Set())
      setPage(1)
      setFeedback(null)
    }
  }, [open])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return pool
    const q = search.trim().toLowerCase()
    return pool.filter((p) =>
      [p.name, p.team ?? ""].join(" ").toLowerCase().includes(q),
    )
  }, [pool, search])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

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
      const allSelected = visible.every((p) => next.has(p.id))
      if (allSelected) {
        for (const p of visible) next.delete(p.id)
      } else {
        for (const p of visible) next.add(p.id)
      }
      return next
    })
  }

  function handlePromote() {
    if (selected.size === 0) return
    setFeedback(null)
    const ids = Array.from(selected)
    startTransition(async () => {
      const res = await promoteFromPreorderAction(ids, targetCategoryId)
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text: `${res.affected} producto${res.affected === 1 ? "" : "s"} promovido${
            res.affected === 1 ? "" : "s"
          } a ${targetCategoryName}.`,
        })
        setSelected(new Set())
        router.refresh()
        // Auto-close after a beat so Ever sees the toast.
        window.setTimeout(() => onOpenChange(false), 900)
      } else {
        setFeedback({ kind: "err", text: res.error })
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <PackagePlus className="size-4 text-primary" />
            Agregar desde Por encargo
          </SheetTitle>
          <SheetDescription className="text-xs">
            Selecciona productos del pool de "por encargo" para promoverlos a{" "}
            <span className="font-semibold text-foreground">
              {targetCategoryName}
            </span>
            . Quedan publicados y desaparecen de "por encargo".
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="border-b p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre o equipo…"
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Limpiar"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={toggleVisible}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent"
              disabled={visible.length === 0}
            >
              <Checkbox
                checked={
                  visible.length > 0 && visible.every((p) => selected.has(p.id))
                }
                tabIndex={-1}
                className="pointer-events-none"
              />
              Seleccionar página ({visible.length})
            </button>
            <span className="tabular-nums">
              {filtered.length === pool.length
                ? `${pool.length} disponibles`
                : `${filtered.length} de ${pool.length}`}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Search className="size-7 opacity-40" />
              {search
                ? `Sin resultados para "${search}"`
                : "El pool de por encargo está vacío."}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {visible.map((p) => {
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
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="line-clamp-2 text-xs font-medium leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {p.basePrice === 0 ? "Sin precio" : `$${p.basePrice}`}
                          {p.team && (
                            <>
                              {" · "}
                              <span className="truncate">{p.team}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} de{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded border px-2 transition-colors",
                  current <= 1
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "hover:bg-accent",
                )}
              >
                <ChevronLeft className="size-3.5" />
                Anterior
              </button>
              <span className="px-2 tabular-nums">
                {current} / {totalPages}
              </span>
              <button
                type="button"
                disabled={current >= totalPages}
                onClick={() => setPage(current + 1)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded border px-2 transition-colors",
                  current >= totalPages
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
          <span className="text-sm tabular-nums text-muted-foreground">
            {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
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
              onClick={handlePromote}
              className="gap-1.5"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PackagePlus className="size-3.5" />
              )}
              Agregar a {targetCategoryName}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
