import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, PencilLine, ShieldCheck, Star } from "lucide-react"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import { getAllApprovedReviews } from "@/lib/queries/public-reviews"
import { cn } from "@/lib/utils"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Reseñas",
  description:
    "Lo que dicen los clientes de M90 Sports. Reseñas verificadas contra pedidos reales.",
  alternates: { canonical: "/resenas" },
  openGraph: {
    title: "Reseñas · M90 Sports",
    description:
      "Lo que dicen los clientes — reseñas verificadas contra pedidos reales.",
    url: "/resenas",
    type: "website",
  },
}

const M90_NAVY = "#011b53"

export default async function ResenasPage() {
  const reviews = await getAllApprovedReviews(200)

  // Aggregate for the hero stat (avg + count).
  const total = reviews.length
  const avg =
    total === 0
      ? 0
      : Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / total) * 10,
        ) / 10

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      <section className="mx-auto max-w-6xl px-5 pt-28 pb-6 md:px-8 md:pt-32 md:pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/65 hover:text-[#011b53]"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio
        </Link>

        <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#980e21]">
              Reseñas
            </span>
            <h1
              className="font-display text-4xl leading-[0.95] tracking-tight md:text-6xl"
              style={{ color: M90_NAVY }}
            >
              Lo que dicen<span style={{ color: "#980e21" }}>.</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#011b53]/75 md:text-base">
              Cada reseña que ves aquí está verificada contra un pedido real.
              Sin opiniones compradas, sin filtros suaves.
            </p>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-3 ring-1 ring-[rgba(1,27,83,0.08)]">
              <div className="font-display text-5xl tabular-nums text-[#011b53]">
                {avg.toFixed(1)}
              </div>
              <div className="flex flex-col gap-0.5">
                <Stars value={avg} />
                <span className="text-[11px] uppercase tracking-widest text-[#011b53]/60">
                  {total} {total === 1 ? "reseña" : "reseñas"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trust + CTA */}
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-[rgba(1,27,83,0.1)] bg-white/65 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs text-[#011b53]/75">
            <ShieldCheck className="size-4 text-emerald-700" />
            Verificamos cada reseña contra el pedido real
          </div>
          <Link
            href="/resenas/nueva"
            className="inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-xs font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
          >
            <PencilLine className="size-3.5" />
            Escribir reseña
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 p-12 text-center">
            <Star className="size-8 text-[#011b53]/30" />
            <p className="text-sm text-[#011b53]/65">
              Aún no hay reseñas publicadas. Sé el primero.
            </p>
            <Link
              href="/resenas/nueva"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-xs font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
            >
              <PencilLine className="size-3.5" />
              Escribir la primera
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl bg-white/90 p-5 ring-1 ring-[rgba(1,27,83,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-full bg-[#011b53]/10 text-xs font-semibold text-[#011b53]">
                      {initials(r.customerName)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#011b53]">
                        {r.customerName}
                      </span>
                      <Stars value={r.rating} size="sm" />
                    </div>
                  </div>
                  <time className="text-[11px] text-[#011b53]/55">
                    {formatDate(r.createdAt)}
                  </time>
                </header>

                {r.title && (
                  <h3 className="text-base font-semibold text-[#011b53]">
                    {r.title}
                  </h3>
                )}
                <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-[#011b53]/85">
                  {r.body}
                </p>

                {r.photoUrl && (
                  <a
                    href={r.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-fit overflow-hidden rounded-lg ring-1 ring-[rgba(1,27,83,0.08)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.photoUrl}
                      alt=""
                      loading="lazy"
                      className="max-h-32 w-auto object-cover"
                    />
                  </a>
                )}

                {r.productSlug && r.productName && (
                  <Link
                    href={`/tienda/${r.productSlug}`}
                    className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-[#011b53]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#011b53] transition-colors hover:bg-[#011b53]/10"
                  >
                    Sobre {r.productName}
                    <ArrowUpRight className="size-3" />
                  </Link>
                )}

                {r.adminResponse && (
                  <div className="mt-1 rounded-xl bg-[rgba(1,27,83,0.04)] p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
                      Respuesta de M90
                    </span>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#011b53]">
                      {r.adminResponse}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <WhatsappFloat />
    </main>
  )
}

function Stars({
  value,
  size = "md",
}: {
  value: number
  size?: "sm" | "md"
}) {
  const dim = size === "sm" ? "size-3.5" : "size-4"
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("relative inline-block", dim)}>
          <Star
            className={cn("absolute inset-0 fill-transparent stroke-[#011b53]/25", dim)}
            strokeWidth={1.5}
            aria-hidden
          />
          <Star
            className={cn("absolute inset-0 fill-amber-400 stroke-amber-500", dim)}
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
