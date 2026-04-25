"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Star, MessageCircle, ArrowUpRight, ShieldCheck } from "lucide-react";
import { asset, whatsappUrl } from "@/lib/utils";

type Review = {
  id: string;
  name: string;
  initials: string;
  city: string;
  rating: number;
  text: string;
  product: string;
};

/**
 * Top 5 approved reviews — moderated.
 *
 * Submission flow (Cuba-compatible, no backend):
 *   Customer clicks "Escribir reseña" → WhatsApp opens with pre-filled template
 *   → admin reviews + verifies against real order → pushes to this array.
 *
 * If volume grows, swap this constant for a Supabase `reviews` query
 * filtered by `approved = true` (not blocked in Cuba).
 */
const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Daniel Reyes",
    initials: "DR",
    city: "La Habana",
    rating: 5,
    text: "Llevo 3 camisetas con ellos y todas perfectas. La del Madrid me llegó en menos de 24h. Sin cuentos, sin vueltas — piden el dato, te mandan foto, pagas y está.",
    product: "Real Madrid 25/26",
  },
  {
    id: "r2",
    name: "Yadira Montero",
    initials: "YM",
    city: "Santiago de Cuba",
    rating: 5,
    text: "Pedí una retro del Milan para mi esposo de sorpresa. Fotos reales antes de pagar, costuras firmes, número bien cosido. Quedó flipado y yo quedé como reina.",
    product: "Milan Retro 02/03",
  },
  {
    id: "r3",
    name: "Alejandro Pérez",
    initials: "AP",
    city: "Camagüey",
    rating: 5,
    text: "Para provincia uno siempre duda. Ellos me dieron código de seguimiento y la camiseta llegó en el tiempo exacto que dijeron. Calidad igualita a las oficiales.",
    product: "Argentina 3 estrellas",
  },
  {
    id: "r4",
    name: "Laura Castillo",
    initials: "LC",
    city: "Matanzas",
    rating: 4.5,
    text: "Les pedí tallas de niños para los dos mellizos y vinieron en el mismo paquete. Repetiré para el cumple — ya me lo están pidiendo ellos mismos.",
    product: "Barça Kids 25",
  },
  {
    id: "r5",
    name: "Ronnie Diago",
    initials: "RD",
    city: "Holguín",
    rating: 5,
    text: "Compré la Lakers de Kobe. Tela pesada como debe ser, sin hilos sueltos. Pagué por Transfermóvil y en 4 días la tenía. M90 es serio, esa es la verdad.",
    product: "Lakers Kobe #24",
  },
];

const submitTemplate = `Hola M90, quiero dejar una reseña:

👤 Mi nombre:
📍 Mi provincia:
👕 Camiseta que compré:
⭐ Puntuación (1-5):

📝 Mi experiencia:
`;

export function Testimonials() {
  // NOTE: no overflow-hidden on this section — it would break position:sticky
  // on the inner ReviewStack container (same bug we hit in categories.tsx).
  return (
    <section
      id="resenas"
      className="relative bg-[color:var(--color-navy)] text-[color:var(--color-cream)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url(${asset("/patterns/m90-pattern-cream.webp")})`,
          backgroundSize: "380px auto",
        }}
      />

      {/* ===== INTRO ===== */}
      <div className="relative mx-auto w-full max-w-[1400px] px-5 pt-24 md:px-10 md:pt-32">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-5xl italic md:text-7xl">
            Lo que dicen<span className="text-[color:var(--color-red-bright)]">.</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="font-display text-5xl italic leading-none text-[color:var(--color-red-bright)] md:text-6xl">
              4.9
            </div>
            <div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-[color:var(--color-red-bright)] text-[color:var(--color-red-bright)]"
                  />
                ))}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-[color:var(--color-cream)]/60">
                900+ pedidos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PINNED SCROLL-DRIVEN STACK ===== */}
      <ReviewStack reviews={REVIEWS} />

      {/* ===== CTA — leave a review ===== */}
      <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-24 md:px-10 md:pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 hidden h-48 w-48 rounded-full bg-[color:var(--color-red)] opacity-30 blur-3xl md:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -bottom-10 hidden h-32 w-32 rounded-full bg-[color:var(--color-red-bright)] opacity-20 blur-3xl md:block"
          />

          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-red-bright)]">
                <span className="h-px w-8 bg-[color:var(--color-red-bright)]" />
                Tu historia también vale
              </div>
              <h3 className="mt-3 font-display text-3xl italic md:text-5xl">
                Deja tu reseña.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--color-cream)]/70">
                Llena la plantilla por WhatsApp — sin cuentas, sin formularios.
                La revisamos y si encaja la publicamos aquí en menos de 48h.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[color:var(--color-cream)]/55">
                <ShieldCheck size={14} className="text-[color:var(--color-green)]" />
                Verificamos cada reseña contra el pedido real
              </div>
            </div>

            <a
              href={whatsappUrl(submitTemplate)}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-red)] px-7 py-4 text-sm font-bold uppercase tracking-widest text-white"
            >
              <span className="absolute inset-0 -translate-x-full bg-[color:var(--color-cream)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
              <MessageCircle
                size={16}
                className="relative z-10 transition-colors duration-500 group-hover:text-[color:var(--color-navy)]"
              />
              <span className="relative z-10 transition-colors duration-500 group-hover:text-[color:var(--color-navy)]">
                Escribir reseña
              </span>
              <ArrowUpRight
                size={16}
                className="relative z-10 transition-all duration-500 group-hover:rotate-45 group-hover:text-[color:var(--color-navy)]"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================================================================
   ReviewStack — pinned section, scroll-driven cards peel upward.

   Mechanics mirror the animated-cards-stack reference:
   - outer div: min-height 300vh so the sticky child stays pinned until
     all cards have animated.
   - inner sticky: h-screen centered flex. Cards live inside a relative
     fixed-height wrapper with 3D perspective.
   - each card has its own scroll segment [start, end] of total progress.
     Within that segment: translateY 0% → -180% (flies up + out).
     Rotation interpolates from `initialRotation` → 0° over a wider
     window [start-1.5, end/1.5] so it "settles" into place before lifting.
   - z-index reverse-indexed so card #0 sits on top of the stack.
   - ci = index + 2 offset mirrors the reference — gives the first card a
     gentle reveal-from-tilt entrance and leaves the last card held at
     rest when the section ends.
   =================================================================== */

function ReviewStack({ reviews }: { reviews: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end end"],
  });

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ minHeight: "300vh", perspective: "1200px" }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center px-5 md:px-10">
        <div className="relative h-[460px] w-full max-w-[400px] md:h-[500px]">
          {reviews.map((r, i) => (
            <StackedCard
              key={r.id}
              review={r}
              index={i}
              total={reviews.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StackedCard({
  review,
  index,
  total,
  progress,
}: {
  review: Review;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Animation window math — matches animated-cards-stack reference.
  const ci = index + 2;
  const denom = total + 1;
  const start = ci / denom;
  const end = (ci + 1) / denom;
  const rotateRange: [number, number] = [start - 1.5, end / 1.5];

  const incrementY = 10;
  const incrementZ = 10;
  const initialRotation = -ci + 90;

  const y = useTransform(progress, [start, end], ["0%", "-180%"]);
  const rotate = useTransform(progress, rotateRange, [initialRotation, 0]);

  // Shadow intensifies as card comes forward — deepens the 3D illusion.
  const shadowY = useTransform(progress, rotateRange, [4, 18]);
  const shadowBlur = useTransform(progress, rotateRange, [8, 36]);
  const shadowAlpha = useTransform(progress, rotateRange, [0.2, 0.55]);
  const filter = useMotionTemplate`drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}))`;

  const transform = useMotionTemplate`translateZ(${ci * incrementZ}px) translateY(${y}) rotate(${rotate}deg)`;

  return (
    <motion.article
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: ci * incrementY,
        height: "100%",
        transform,
        filter,
        zIndex: (total - index) * incrementZ,
        backfaceVisibility: "hidden",
        willChange: "transform",
      }}
      className="flex flex-col justify-between gap-6 rounded-3xl border border-white/15 bg-[color:var(--color-navy-900)]/95 p-6 backdrop-blur-md md:p-8"
      role="article"
      aria-labelledby={`review-${review.id}-name`}
    >
      {/* Top: rating + verified chip */}
      <div className="flex items-center justify-between gap-3">
        <ReviewStars rating={review.rating} />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-green)]/30 bg-[color:var(--color-green)]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-[color:var(--color-green)]">
          <ShieldCheck size={11} />
          Verificada
        </span>
      </div>

      {/* Quote */}
      <blockquote className="flex-1 text-base leading-relaxed text-[color:var(--color-cream)]/95 md:text-lg">
        <span
          aria-hidden
          className="mr-1 font-display text-4xl italic leading-none text-[color:var(--color-red-bright)]"
        >
          &ldquo;
        </span>
        {review.text}
      </blockquote>

      {/* Footer: avatar + name + product */}
      <div className="flex items-center gap-4 border-t border-white/10 pt-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--color-red)] font-display text-sm italic text-white shadow-[0_8px_20px_-6px_rgba(152,14,33,0.6)]">
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div
            id={`review-${review.id}-name`}
            className="truncate font-display text-lg italic"
          >
            {review.name}
          </div>
          <div className="truncate text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-cream)]/55">
            {review.city} · {review.product}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full > 0;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f-${i}`}
          size={16}
          className="fill-[color:var(--color-red-bright)] text-[color:var(--color-red-bright)]"
        />
      ))}
      {hasHalf ? (
        <div className="relative">
          <Star size={16} className="text-[color:var(--color-red-bright)]/30" />
          <div className="absolute inset-0 w-1/2 overflow-hidden">
            <Star
              size={16}
              className="fill-[color:var(--color-red-bright)] text-[color:var(--color-red-bright)]"
            />
          </div>
        </div>
      ) : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e-${i}`}
          size={16}
          className="text-[color:var(--color-cream)]/25"
        />
      ))}
      <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-cream)]/55">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
