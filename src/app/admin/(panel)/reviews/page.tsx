"use client"

import * as React from "react"
import Link from "next/link"
import {
  Camera,
  Check,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Search,
  Star,
  StarOff,
  ThumbsUp,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomerAvatar } from "@/components/admin/customer-avatar"
import { StarRating } from "@/components/admin/star-rating"
import {
  countReviews,
  FEATURED_LIMIT,
  mockReviews,
  REVIEW_STATUS_LABEL,
  type MockReview,
  type ReviewStatus,
} from "@/lib/mock-reviews"

type StatusFilter = ReviewStatus | "all"

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<MockReview[]>(mockReviews)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("pending")

  const counts = React.useMemo(() => {
    return {
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: reviews.filter((r) => r.status === "approved").length,
      rejected: reviews.filter((r) => r.status === "rejected").length,
      featured: reviews.filter((r) => r.featured).length,
      total: reviews.length,
    }
  }, [reviews])

  const featured = React.useMemo(
    () => reviews.filter((r) => r.featured && r.status === "approved"),
    [reviews]
  )

  const filtered = React.useMemo(() => {
    return reviews
      .filter((r) => {
        if (statusFilter === "all") return true
        return r.status === statusFilter
      })
      .filter((r) => {
        if (!search) return true
        const q = search.toLowerCase()
        return [r.customerName, r.productName, r.team, r.body, r.customerCity ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [reviews, search, statusFilter])

  const approve = (id: string) => {
    setReviews((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as ReviewStatus,
              approvedAt: new Date().toISOString(),
            }
          : r
      )
    )
    toast.success("Reseña aprobada", {
      description: "Visible en /reviews. Decide si quieres destacarla en la home.",
    })
  }

  const reject = (id: string) => {
    setReviews((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, status: "rejected" as ReviewStatus, featured: false } : r
      )
    )
    toast.error("Reseña rechazada", { description: "No aparecerá públicamente." })
  }

  const toggleFeature = (id: string) => {
    const isFeatured = reviews.find((r) => r.id === id)?.featured
    if (!isFeatured && counts.featured >= FEATURED_LIMIT) {
      toast.warning(`Máximo ${FEATURED_LIMIT} destacadas`, {
        description: "Quita una destacada antes de añadir otra.",
      })
      return
    }
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, featured: !r.featured } : r))
    )
    toast.success(
      isFeatured ? "Quitada de destacadas" : "Añadida a destacadas en home"
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Reseñas
        </h2>
        <p className="text-sm text-muted-foreground">
          Modera reseñas de clientes. Aprueba, rechaza o destaca en home. <strong className="text-foreground">No se pueden editar</strong> — sería deshonesto.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Pendientes"
          value={counts.pending}
          icon={MessageSquare}
          tone="warning"
          urgent={counts.pending > 0}
          active={statusFilter === "pending"}
          onClick={() =>
            setStatusFilter(statusFilter === "pending" ? "all" : "pending")
          }
        />
        <StatTile
          label="Aprobadas"
          value={counts.approved}
          icon={ThumbsUp}
          tone="success"
          active={statusFilter === "approved"}
          onClick={() =>
            setStatusFilter(statusFilter === "approved" ? "all" : "approved")
          }
        />
        <StatTile
          label="Rechazadas"
          value={counts.rejected}
          icon={X}
          tone="destructive"
          active={statusFilter === "rejected"}
          onClick={() =>
            setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")
          }
        />
        <StatTile
          label={`Destacadas en home`}
          value={`${counts.featured}/${FEATURED_LIMIT}`}
          icon={Star}
          tone="default"
        />
      </div>

      {/* Featured row */}
      <Card className="overflow-hidden rounded-xl border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-transparent shadow-card">
        <div className="flex items-start justify-between gap-3 border-b border-amber-500/15 bg-amber-500/5 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300">
              <Star className="size-4 fill-current" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold leading-tight">
                Reseñas destacadas en la home
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {counts.featured} de {FEATURED_LIMIT} usadas — aparecen con efecto scroll en la landing
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-3 md:p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: FEATURED_LIMIT }).map((_, idx) => {
              const review = featured[idx]
              if (!review) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-amber-500/20 bg-amber-500/[0.03] p-3 text-center"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Plus className="size-4 text-amber-700/40 dark:text-amber-300/40" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-amber-700/60 dark:text-amber-300/60">
                        Slot {idx + 1}
                      </span>
                    </div>
                  </div>
                )
              }
              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => toggleFeature(review.id)}
                  className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-amber-500/30 bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  aria-label={`Quitar destacada de ${review.customerName}`}
                >
                  <div className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-amber-500 text-white opacity-100 transition-opacity">
                    <Star className="size-2.5 fill-current" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CustomerAvatar name={review.customerName} size="sm" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-semibold leading-tight">
                        {review.customerName}
                      </span>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                  <p className="line-clamp-3 text-[11px] leading-tight text-muted-foreground">
                    &ldquo;{review.body}&rdquo;
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters bar */}
      <Card className="gap-0 rounded-xl border-border/70 bg-card p-3 shadow-card md:p-4">
        <CardContent className="flex flex-col gap-3 p-0 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, producto o texto..."
              className="h-10 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 px-3">
                <Filter className="size-4" />
                Estado
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {REVIEW_STATUS_LABEL[statusFilter]}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Filtrar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Todas
                {statusFilter === "all" && <span className="ml-auto text-xs">●</span>}
              </DropdownMenuItem>
              {(["pending", "approved", "rejected"] as ReviewStatus[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                  {REVIEW_STATUS_LABEL[s]}
                  {statusFilter === s && <span className="ml-auto text-xs">●</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="gap-3 p-12 text-center shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-0">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <MessageSquare className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Sin reseñas</h3>
              <p className="text-xs text-muted-foreground">
                {statusFilter === "pending"
                  ? "Todo al día. Los clientes felices te dejarán nuevas reseñas pronto."
                  : "No hay reseñas en este filtro."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {filtered.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onApprove={() => approve(r.id)}
              onReject={() => reject(r.id)}
              onToggleFeature={() => toggleFeature(r.id)}
              canFeature={
                r.featured || counts.featured < FEATURED_LIMIT
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({
  review,
  onApprove,
  onReject,
  onToggleFeature,
  canFeature,
}: {
  review: MockReview
  onApprove: () => void
  onReject: () => void
  onToggleFeature: () => void
  canFeature: boolean
}) {
  const isPending = review.status === "pending"
  const isApproved = review.status === "approved"
  const isRejected = review.status === "rejected"

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-xl border-border/70 shadow-card transition-shadow hover:shadow-card-hover",
        review.featured && "border-amber-500/40",
        isRejected && "opacity-70"
      )}
    >
      {review.featured && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
          <Star className="size-2.5 fill-current" />
          Destacada
        </div>
      )}
      {review.hasPhoto && (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 ring-1 ring-inset ring-sky-500/30 dark:text-sky-300">
          <Camera className="size-2.5" />
          Con foto
        </div>
      )}

      <CardContent className="flex flex-col gap-3 p-5 pt-12">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={review.customerName} size="md" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold leading-tight">
                {review.customerName}
              </span>
              <Badge
                variant="outline"
                className="h-4 border-border/70 px-1 text-[9px] font-medium"
              >
                {review.customerCountry}
              </Badge>
            </div>
            <span className="truncate text-[11px] text-muted-foreground">
              {review.customerCity ?? "Cuba"}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>

        {review.hasPhoto && (
          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/40">
            <div className="flex flex-col items-center gap-1.5">
              <ImageIcon className="size-6 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground">
                Foto del cliente con producto
              </span>
            </div>
          </div>
        )}

        <p className="line-clamp-4 text-sm leading-relaxed text-foreground/90">
          &ldquo;{review.body}&rdquo;
        </p>

        <Link
          href={`/admin/products/${review.productId}`}
          className="flex items-center gap-1 truncate text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Producto:{" "}
          <span className="truncate font-medium">{review.productName}</span>
        </Link>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isPending && (
            <>
              <Button
                size="sm"
                onClick={onApprove}
                className="h-8 flex-1 gap-1 sm:flex-none"
              >
                <Check className="size-3.5" /> Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="h-8 gap-1 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              >
                <X className="size-3.5" /> Rechazar
              </Button>
            </>
          )}

          {isApproved && (
            <>
              <Button
                size="sm"
                variant={review.featured ? "secondary" : "outline"}
                onClick={onToggleFeature}
                disabled={!canFeature}
                className="h-8 flex-1 gap-1 sm:flex-none"
              >
                {review.featured ? (
                  <>
                    <StarOff className="size-3.5" /> Quitar destacada
                  </>
                ) : (
                  <>
                    <Star className="size-3.5" /> Destacar en home
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReject}
                className="h-8 gap-1 text-muted-foreground hover:text-rose-700"
              >
                <X className="size-3.5" />
                <span className="hidden sm:inline">Ocultar</span>
              </Button>
            </>
          )}

          {isRejected && (
            <Button
              size="sm"
              variant="outline"
              onClick={onApprove}
              className="h-8 gap-1"
            >
              <Check className="size-3.5" /> Restaurar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
  active,
  onClick,
  urgent,
}: {
  label: string
  value: number | string
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "success" | "warning" | "destructive" | "info"
  active?: boolean
  onClick?: () => void
  urgent?: boolean
}) {
  const toneStyle = {
    default: "text-primary bg-primary/8 ring-primary/15",
    success:
      "text-emerald-700 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-300",
    warning:
      "text-amber-700 bg-amber-500/12 ring-amber-500/20 dark:text-amber-300",
    info: "text-sky-700 bg-sky-500/10 ring-sky-500/15 dark:text-sky-300",
    destructive:
      "text-rose-700 bg-rose-500/10 ring-rose-500/15 dark:text-rose-300",
  }[tone]

  const content = (
    <Card
      className={cn(
        "group relative gap-1.5 rounded-xl border-border/70 p-4 shadow-card transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
        active && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
        urgent && !active && tone === "warning" && "border-amber-500/30"
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
