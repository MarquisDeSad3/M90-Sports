import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  ProductRatingSummary,
  PublicReview,
} from "@/lib/queries/public-reviews"

interface Props {
  reviews: PublicReview[]
  summary: ProductRatingSummary
}

export function ProductReviews({ reviews, summary }: Props) {
  if (summary.reviewCount === 0) {
    // Don't render an empty section — keeps the page tighter for new
    // products. The "compra y deja la primera" prompt happens via the
    // post-purchase flow, not here.
    return null
  }

  return (
    <section className="mt-12 border-t border-[rgba(1,27,83,0.1)] pt-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Summary column */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Reseñas
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl tabular-nums text-[#011b53]">
              {summary.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-[#011b53]/55 tabular-nums">
              / 5
            </span>
          </div>
          <Stars value={summary.averageRating} size="md" />
          <span className="text-xs text-[#011b53]/65 tabular-nums">
            Basado en {summary.reviewCount}{" "}
            {summary.reviewCount === 1 ? "reseña" : "reseñas"}
          </span>

          {/* Distribution bars */}
          <ul className="mt-3 flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count =
                summary.distribution[stars as 1 | 2 | 3 | 4 | 5] ?? 0
              const pct =
                summary.reviewCount === 0
                  ? 0
                  : (count / summary.reviewCount) * 100
              return (
                <li
                  key={stars}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs text-[#011b53]/70"
                >
                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                    {stars}
                    <Star className="size-3 fill-[#011b53] stroke-[#011b53]" />
                  </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(1,27,83,0.08)]">
                    <div
                      className="h-full bg-[#011b53] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[#011b53]/55">{count}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Reviews list */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="rounded-2xl bg-white/85 p-4 ring-1 ring-[rgba(1,27,83,0.08)] md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-full bg-[#011b53]/10 text-xs font-semibold text-[#011b53]">
            {initials(review.customerName)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-[#011b53]">
              {review.customerName}
            </span>
            <Stars value={review.rating} size="sm" />
          </div>
        </div>
        <time className="text-[11px] text-[#011b53]/55">
          {formatDate(review.createdAt)}
        </time>
      </header>

      {review.title && (
        <h3 className="mt-3 text-base font-semibold text-[#011b53]">
          {review.title}
        </h3>
      )}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#011b53]/85">
        {review.body}
      </p>

      {review.photoUrl && (
        <a
          href={review.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-fit overflow-hidden rounded-lg ring-1 ring-[rgba(1,27,83,0.08)] transition-all hover:ring-[#011b53]/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={review.photoUrl}
            alt={`Foto de la reseña de ${review.customerName}`}
            loading="lazy"
            className="max-h-48 w-auto object-cover"
          />
        </a>
      )}

      {review.adminResponse && (
        <div className="mt-4 rounded-xl bg-[rgba(1,27,83,0.05)] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Respuesta de M90
          </span>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#011b53]">
            {review.adminResponse}
          </p>
        </div>
      )}
    </article>
  )
}

function Stars({
  value,
  size = "md",
}: {
  value: number
  size?: "sm" | "md"
}) {
  const dimensions = size === "sm" ? "size-3.5" : "size-4"
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("relative inline-block", dimensions)}>
          <Star
            className={cn(
              "absolute inset-0 fill-transparent stroke-[#011b53]/25",
              dimensions,
            )}
            strokeWidth={1.5}
            aria-hidden
          />
          <Star
            className={cn(
              "absolute inset-0 fill-amber-400 stroke-amber-500",
              dimensions,
            )}
            strokeWidth={1.5}
            style={{
              clipPath:
                value >= i
                  ? "inset(0 0 0 0)"
                  : value >= i - 0.5
                    ? "inset(0 50% 0 0)"
                    : "inset(0 100% 0 0)",
            }}
            aria-hidden
          />
        </span>
      ))}
    </span>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-CU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

/**
 * Compact rating row — tiny stars + count, designed to sit next to
 * the price on the product detail page or in product cards.
 */
export function RatingPill({
  summary,
  size = "md",
}: {
  summary: ProductRatingSummary
  size?: "sm" | "md"
}) {
  if (summary.reviewCount === 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#011b53]/75">
      <Stars value={summary.averageRating} size={size} />
      <span className="tabular-nums">
        {summary.averageRating.toFixed(1)}
      </span>
      <span className="text-[#011b53]/55">
        ({summary.reviewCount}{" "}
        {summary.reviewCount === 1 ? "reseña" : "reseñas"})
      </span>
    </span>
  )
}
