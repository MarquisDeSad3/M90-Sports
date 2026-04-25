import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, MessageCircle, Star } from "lucide-react"
import {
  TestimonialsColumn,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns"
import { getApprovedReviews } from "@/lib/queries/reviews"

export const metadata: Metadata = {
  title: "Reseñas de clientes — M90 Sports",
  description:
    "Lo que dicen los clientes de M90 Sports — jerseys NBA y fútbol entregados en Cuba con cariño.",
}

const M90_NAVY = "#011b53"
const M90_CREAM_SOFT = "#f7ebc8"

export default async function PublicReviewsPage() {
  const reviews = await getApprovedReviews()
  const approved = reviews.map<TestimonialItem>((r) => ({
    id: r.id,
    name: r.customerName,
    city: r.customerCity,
    country: r.customerCountry,
    body: r.body,
    rating: r.rating,
    photoUrl: r.photoUrl,
  }))

  const total = reviews.length
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  const avg = total > 0 ? sum / total : 0
  const counts = { approved: total }

  // Distribute roughly evenly across columns
  const perCol = Math.ceil(total / 3)
  const col1 = approved.slice(0, perCol)
  const col2 = approved.slice(perCol, perCol * 2)
  const col3 = approved.slice(perCol * 2)

  return (
    <main
      className="relative min-h-svh overflow-hidden"
      style={{
        background: M90_CREAM_SOFT,
        color: M90_NAVY,
      }}
    >
      {/* Subtle backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
          style={{ color: M90_NAVY }}
        >
          <ArrowLeft className="size-4" />
          M90 Sports
        </Link>
        <a
          href="https://wa.me/5351191461"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: M90_NAVY }}
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </a>
      </header>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 py-12 text-center md:py-20">
        <div
          className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur-sm"
          style={{ borderColor: "rgba(1,27,83,0.15)", color: M90_NAVY }}
        >
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          Reseñas verificadas
        </div>

        <h1
          className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl"
          style={{ color: M90_NAVY }}
        >
          Lo que dicen
          <br />
          <span style={{ color: "#980e21" }}>nuestros clientes</span>
        </h1>

        <p
          className="max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "rgba(1,27,83,0.7)" }}
        >
          Cubanos en la isla y en la diáspora confían en M90 para llevarles los
          jerseys que aman. Aquí cada palabra es real, sin ediciones.
        </p>

        {/* Aggregated stats */}
        <div className="mt-3 flex items-center gap-6 md:gap-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span
                className="font-display text-3xl tabular-nums md:text-4xl"
                style={{ color: M90_NAVY }}
              >
                {avg.toFixed(1)}
              </span>
              <Star className="size-5 fill-amber-400 text-amber-400 md:size-6" />
            </div>
            <span
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(1,27,83,0.6)" }}
            >
              Rating promedio
            </span>
          </div>

          <div
            className="h-10 w-px"
            style={{ background: "rgba(1,27,83,0.15)" }}
          />

          <div className="flex flex-col items-center">
            <span
              className="font-display text-3xl tabular-nums md:text-4xl"
              style={{ color: M90_NAVY }}
            >
              {counts.approved}
            </span>
            <span
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(1,27,83,0.6)" }}
            >
              Reseñas verificadas
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials columns with infinite scroll */}
      <section
        className="relative mx-auto flex max-w-6xl justify-center gap-5 overflow-hidden px-5 pb-16 md:gap-6 md:px-8"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          maxHeight: "min(90svh, 820px)",
        }}
      >
        <div className="testimonials-public flex w-full justify-center gap-5 md:gap-6">
          <TestimonialsColumn testimonials={col1} duration={26} />
          <TestimonialsColumn
            testimonials={col2}
            className="hidden md:block"
            duration={32}
          />
          <TestimonialsColumn
            testimonials={col3}
            className="hidden lg:block"
            duration={29}
          />
        </div>
      </section>

      {/* CTA bottom */}
      <section className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-12 text-center md:py-16">
        <h2
          className="font-display text-3xl leading-tight md:text-4xl"
          style={{ color: M90_NAVY }}
        >
          ¿Quieres dejar la tuya?
        </h2>
        <p
          className="max-w-md text-sm leading-relaxed md:text-base"
          style={{ color: "rgba(1,27,83,0.7)" }}
        >
          Después de recibir tu jersey, escríbenos por WhatsApp con tu reseña y
          una foto. La publicamos sin editar — palabra cubana.
        </p>
        <a
          href="https://wa.me/5351191461?text=Hola%20M90%2C%20quiero%20dejar%20una%20rese%C3%B1a%20de%20mi%20pedido"
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ background: M90_NAVY }}
        >
          <MessageCircle className="size-4" />
          Dejar reseña por WhatsApp
        </a>
      </section>

      {/* Local style overrides for testimonials cards (since this page is outside admin-scope) */}
      <style>{`
        .testimonials-public article {
          background: white;
          color: ${M90_NAVY};
          border-color: rgba(1,27,83,0.1);
          box-shadow: 0 4px 16px -6px rgba(1,27,83,0.08);
        }
        .testimonials-public article p {
          color: rgba(1,27,83,0.85);
        }
        .testimonials-public article span {
          color: ${M90_NAVY};
        }
        .testimonials-public .text-muted-foreground {
          color: rgba(1,27,83,0.55) !important;
        }
      `}</style>
    </main>
  )
}
