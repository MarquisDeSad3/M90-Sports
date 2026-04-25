"use client"

import * as React from "react"
import Link from "next/link"
import {
  Archive,
  ArrowUpDown,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductImage } from "@/components/admin/product-image"
import { ProductStatusBadge } from "@/components/admin/product-status-badge"
import { StockPill } from "@/components/admin/stock-pill"
import {
  getProductTotalStock,
  LEAGUE_LABEL,
  type League,
  type MockProduct,
  type ProductStatus,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type StatusFilter = ProductStatus | "all"
type LeagueFilter = League | "all"

export interface ProductsListClientProps {
  products: MockProduct[]
  counts: {
    total: number
    published: number
    draft: number
    outOfStock: number
  }
}

export function ProductsListClient({ products, counts }: ProductsListClientProps) {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [league, setLeague] = React.useState<LeagueFilter>("all")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (status !== "all" && p.status !== status) return false
      if (league !== "all" && p.league !== league) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          p.name,
          p.team,
          p.player ?? "",
          p.season ?? "",
          ...p.tags,
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [search, status, league])

  const stats = counts

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p) => p.id)))
    }
  }

  const hasFilters = status !== "all" || league !== "all" || search.length > 0
  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    setLeague("all")
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Productos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tu catálogo: jerseys, gorras, conjuntos y más.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-4" />
            <span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/products/new">
              <Plus className="size-4" />
              <span>Crear producto</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Total"
          value={stats.total}
          icon={Package}
          href={null}
          active={status === "all"}
          onClick={() => setStatus("all")}
        />
        <StatTile
          label="Publicados"
          value={stats.published}
          tone="success"
          active={status === "published"}
          onClick={() => setStatus("published")}
        />
        <StatTile
          label="Borradores"
          value={stats.draft}
          tone="warning"
          active={status === "draft"}
          onClick={() => setStatus("draft")}
        />
        <StatTile
          label="Sin stock"
          value={stats.outOfStock}
          tone="destructive"
          active={false}
        />
      </div>

      {/* Filters bar */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 shadow-card md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, equipo, jugador, tag..."
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

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 px-3"
                >
                  <Filter className="size-4" />
                  Liga
                  {league !== "all" && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {LEAGUE_LABEL[league]}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Liga</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLeague("all")}>
                  Todas
                  {league === "all" && (
                    <span className="ml-auto text-xs">●</span>
                  )}
                </DropdownMenuItem>
                {(["NBA", "NFL", "MLB", "FUTBOL", "OTRO"] as League[]).map(
                  (l) => (
                    <DropdownMenuItem
                      key={l}
                      onClick={() => setLeague(l)}
                    >
                      {LEAGUE_LABEL[l]}
                      {league === l && (
                        <span className="ml-auto text-xs">●</span>
                      )}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 px-3"
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden md:inline">Más filtros</span>
            </Button>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 gap-1 text-xs text-muted-foreground"
              >
                <X className="size-3.5" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar (animated in when something selected) */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">
              {selected.size}
            </span>{" "}
            <span className="text-muted-foreground">seleccionado(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="size-3.5" /> Publicar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Archive className="size-3.5" /> Archivar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700">
              <Trash2 className="size-3.5" /> Eliminar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="gap-3 p-12 text-center shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-0">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Sin resultados</h3>
              <p className="text-xs text-muted-foreground">
                Prueba ajustar los filtros o cambiar la búsqueda.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <Card className="hidden gap-0 overflow-hidden rounded-xl border-border/70 p-0 shadow-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={
                      filtered.length > 0 && selected.size === filtered.length
                    }
                    onChange={toggleAll}
                    className="size-4 cursor-pointer rounded border-border accent-primary"
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground">
                    Producto <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-medium">Liga</th>
                <th className="px-3 py-3 text-left font-medium">Stock</th>
                <th className="px-3 py-3 text-right font-medium">
                  <button className="inline-flex items-center gap-1 hover:text-foreground">
                    Precio <ArrowUpDown className="size-3" />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  Vendidos · 30d
                </th>
                <th className="px-3 py-3 text-left font-medium">Estado</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((product) => {
                const total = getProductTotalStock(product)
                const isSelected = selected.has(product.id)
                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "group transition-colors",
                      isSelected ? "bg-primary/[0.04]" : "hover:bg-accent/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${product.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="size-4 cursor-pointer rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-3"
                      >
                        <ProductImage
                          team={product.team}
                          number={product.number}
                          size="md"
                          imageUrl={product.primaryImage}
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-foreground group-hover:text-primary">
                              {product.name}
                            </span>
                            {product.featured && (
                              <Sparkles
                                className="size-3 shrink-0 text-amber-500"
                                aria-label="Destacado"
                              />
                            )}
                            {product.isPreorder && (
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] font-semibold border-sky-500/30 text-sky-700 dark:text-sky-300"
                              >
                                PRE
                              </Badge>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {product.team}
                            {product.season && ` · ${product.season}`}
                            {product.player && ` · #${product.number} ${product.player}`}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {LEAGUE_LABEL[product.league]}
                    </td>
                    <td className="px-3 py-3">
                      <StockPill total={total} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end leading-tight">
                        <span className="font-semibold tabular-nums">
                          ${product.basePrice}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                            ${product.compareAtPrice}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="flex flex-col items-end leading-tight">
                        <span className="font-medium">
                          {product.unitsSold30d}
                        </span>
                        {product.revenueThisMonth > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            ${product.revenueThisMonth}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-60 hover:opacity-100"
                            aria-label="Acciones"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="size-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="size-4" />
                            Ver en tienda
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="size-4" />
                            Archivar
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive">
                            <Trash2 className="size-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {filtered.map((product) => {
            const total = getProductTotalStock(product)
            return (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="block"
              >
                <Card className="gap-3 rounded-xl border-border/70 bg-card p-3 shadow-card transition-all active:scale-[0.99]">
                  <CardContent className="flex gap-3 p-0">
                    <ProductImage
                      team={product.team}
                      number={product.number}
                      size="lg"
                      imageUrl={product.primaryImage}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start gap-1.5">
                        <span className="line-clamp-2 flex-1 text-sm font-semibold leading-tight">
                          {product.name}
                        </span>
                        {product.featured && (
                          <Sparkles className="size-3.5 shrink-0 text-amber-500" />
                        )}
                      </div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {product.team}
                        {product.season && ` · ${product.season}`}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <ProductStatusBadge status={product.status} />
                        <StockPill total={total} />
                        {product.isPreorder && (
                          <Badge
                            variant="outline"
                            className="border-sky-500/30 text-[10px] text-sky-700 dark:text-sky-300"
                          >
                            Pre-orden
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-base font-bold tabular-nums">
                        ${product.basePrice}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-muted-foreground line-through tabular-nums">
                          ${product.compareAtPrice}
                        </span>
                      )}
                      <span className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                        {product.unitsSold30d} vend.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mostrando{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {filtered.length}
            </span>{" "}
            de{" "}
            <span className="tabular-nums">{counts.total}</span> productos
          </span>
        </div>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
  active,
  onClick,
  href,
}: {
  label: string
  value: number
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "success" | "warning" | "destructive"
  active?: boolean
  onClick?: () => void
  href?: string | null
}) {
  const toneStyle = {
    default: "text-primary bg-primary/8 ring-primary/15",
    success:
      "text-emerald-700 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-300",
    warning:
      "text-amber-700 bg-amber-500/12 ring-amber-500/20 dark:text-amber-300",
    destructive:
      "text-rose-700 bg-rose-500/10 ring-rose-500/15 dark:text-rose-300",
  }[tone]

  const content = (
    <Card
      className={cn(
        "group relative gap-1.5 rounded-xl border-border/70 p-4 shadow-card transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
        active && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
      )}
    >
      <CardContent className="flex flex-col gap-1.5 p-0">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          {Icon && (
            <div
              className={cn(
                "grid size-7 place-items-center rounded-md ring-1 ring-inset",
                toneStyle
              )}
            >
              <Icon className="size-3.5" />
            </div>
          )}
        </div>
        <div className="font-display text-2xl tracking-tight tabular-nums leading-none">
          {value}
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left">
        {content}
      </button>
    )
  }
  return content
}
