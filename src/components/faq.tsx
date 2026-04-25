"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Reusing the same Unsplash set used across the site so the thumbnails
// feel consistent with the rest of the brand.
const PHOTOS = {
  a: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=320&q=80",
  b: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=320&q=80",
  c: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=320&q=80",
  d: "https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=320&q=80",
};

type FaqItem = {
  q: string;
  a: string;
  imgs: [string, string];
};

const FAQS: FaqItem[] = [
  {
    q: "¿Las camisetas son originales?",
    a: "Trabajamos calidad thai AAA+ y, a pedido, versiones jugador originales con sus etiquetas. Antes de pagar te decimos exactamente qué versión tenemos de ese modelo y te enviamos fotos reales.",
    imgs: [PHOTOS.a, PHOTOS.d],
  },
  {
    q: "¿Puedo personalizarla con mi nombre y número?",
    a: "Sí. Incluimos estampado de nombre y dorsal en el tipo oficial de cada liga. Súmale 5 USD al precio base. Tarda 24h extra de preparación.",
    imgs: [PHOTOS.d, PHOTOS.b],
  },
  {
    q: "¿Hacen envíos fuera de La Habana?",
    a: "Sí, a las 16 provincias. Usamos mensajería con seguimiento. Tarifa y tiempo varían por destino — te los confirmamos por WhatsApp antes del pago.",
    imgs: [PHOTOS.b, PHOTOS.c],
  },
  {
    q: "¿Qué tallas manejan?",
    a: "Adulto de S a 3XL. Niños de 4 a 14 años. Si tienes dudas con la talla te ayudamos con la tabla del fabricante y comparamos con una camiseta tuya.",
    imgs: [PHOTOS.c, PHOTOS.a],
  },
  {
    q: "¿Puedo pagar con USD desde el exterior?",
    a: "Sí. Aceptamos Zelle con nuestro contacto en EE.UU. y transferencias MLC. El familiar en Cuba recibe el pedido en su puerta.",
    imgs: [PHOTOS.a, PHOTOS.b],
  },
  {
    q: "¿Y si la camiseta no es como la foto?",
    a: "La cambiamos o devolvemos el 100% del dinero. Por eso siempre enviamos fotos reales antes de cerrar el pago. Cero sorpresas.",
    imgs: [PHOTOS.d, PHOTOS.c],
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    // NOTE: no `overflow-hidden` on the section — the reveal thumbnails sit
    // slightly outside the content column and would get clipped otherwise.
    <section
      id="faq"
      className="relative bg-[color:var(--color-cream-soft)] py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-[1100px] px-5 md:px-10">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red)]">
            <span className="h-px w-10 bg-[color:var(--color-red)]" />
            Preguntas frecuentes
            <span className="h-px w-10 bg-[color:var(--color-red)]" />
          </div>
          <h2 className="mt-4 font-display text-5xl italic text-[color:var(--color-navy)] md:text-7xl">
            Te leemos la mente.
          </h2>
        </div>

        <div className="divide-y divide-[color:var(--color-navy)]/10 border-y border-[color:var(--color-navy)]/10">
          {FAQS.map((item, i) => (
            <FaqRow
              key={item.q}
              item={item}
              isOpen={open === i}
              isHovered={hovered === i}
              onToggle={() => setOpen(open === i ? null : i)}
              onEnter={() => setHovered(i)}
              onLeave={() => setHovered(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==============================================================
   FaqRow
   - text fades to 40% when the row is active (hover or open)
   - two thumbnails reveal on the right with staggered timing:
     • back image: flat, scales + fades in first
     • front image: scales in a bit later, then translates + rotates
       to peek out from behind the back one
   - mobile: thumbnails hidden (hidden md:block) so they don't collide
     with the wrapped question text
   ============================================================== */

function FaqRow({
  item,
  isOpen,
  isHovered,
  onToggle,
  onEnter,
  onLeave,
}: {
  item: FaqItem;
  isOpen: boolean;
  isHovered: boolean;
  onToggle: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const show = isOpen || isHovered;

  return (
    <div
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
        aria-expanded={isOpen}
      >
        <h3
          className={cn(
            "relative font-display text-2xl italic text-[color:var(--color-navy)] transition-opacity duration-500 md:text-3xl",
            show ? "opacity-40" : "opacity-100",
          )}
        >
          {item.q}
        </h3>
        <span
          className={cn(
            "relative z-40 grid h-12 w-12 shrink-0 place-items-center rounded-full border text-[color:var(--color-navy)] transition-all duration-300",
            isOpen
              ? "rotate-45 border-[color:var(--color-red)] bg-[color:var(--color-red)] text-white"
              : show
                ? "border-[color:var(--color-red)]/60"
                : "border-[color:var(--color-navy)]/20",
          )}
          aria-hidden
        >
          <Plus size={18} />
        </span>
      </button>

      {/* ====== Reveal thumbnails — desktop only ====== */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-20 top-6 z-30 hidden h-20 w-16 md:block lg:right-24"
      >
        {/* Back image — scales + fades (no rotation) */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            show
              ? "scale-100 opacity-100 shadow-[0_18px_40px_-12px_rgba(1,27,83,0.45)]"
              : "scale-0 opacity-0",
          )}
          style={{ transitionDelay: show ? "100ms" : "0ms" }}
        >
          <img
            src={item.imgs[1]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Front image — scales in a beat later, then slides down + right
            and rotates 12° so it peeks out from behind the back image */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            show
              ? "translate-x-6 translate-y-6 rotate-12"
              : "translate-x-0 translate-y-0 rotate-0",
          )}
          style={{ transitionDelay: show ? "150ms" : "0ms" }}
        >
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-md transition-all duration-300",
              show
                ? "scale-100 opacity-100 shadow-[0_22px_50px_-14px_rgba(1,27,83,0.55)]"
                : "scale-0 opacity-0",
            )}
          >
            <img
              src={item.imgs[0]}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* ====== Answer (accordion) ====== */}
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-3xl pb-6 text-lg leading-relaxed text-[color:var(--color-navy)]/75">
              {item.a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
