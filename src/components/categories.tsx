"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Category = {
  slug: string;
  title: string;
  count: string;
  statement: string;
  photo: string;
};

// Photos from Unsplash (free for commercial use). Each one matches the
// category vibe — football kit close-ups, sneaker macros, etc.
const UNSPLASH = {
  clubes: "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=1600&q=80",
  selecciones: "https://images.unsplash.com/photo-1602773692589-bd06d1d96cb1?w=1600&q=80",
  retro: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600&q=80",
  zapatillas: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80",
  accesorios: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80",
  otros: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80",
};

const CATEGORIES: Category[] = [
  {
    slug: "clubes",
    title: "Clubes",
    count: "Camisetas 1:1",
    statement:
      "Del Bernabéu al Camp Nou. Versiones fan y jugador en calidad 1:1.",
    photo: UNSPLASH.clubes,
  },
  {
    slug: "selecciones",
    title: "Selecciones",
    count: "Mundial · Copa",
    statement:
      "Copa América, Eurocopa, Mundial. Los colores que levantan una nación.",
    photo: UNSPLASH.selecciones,
  },
  {
    slug: "retro",
    title: "Retro",
    count: "Clásicos 90s",
    statement:
      "Del Piero 97, Ronaldinho 06, Bergkamp 98. Edición limitada, se van.",
    photo: UNSPLASH.retro,
  },
  {
    slug: "zapatillas",
    title: "Zapatillas",
    count: "Originales",
    statement:
      "Sneakers y botines originales. Lo que se pone el que sabe.",
    photo: UNSPLASH.zapatillas,
  },
  {
    slug: "accesorios",
    title: "Accesorios",
    count: "Bufandas · llaveros",
    statement:
      "Bufandas, llaveros, parches. Detalles que rematan el outfit.",
    photo: UNSPLASH.accesorios,
  },
  {
    slug: "otros",
    title: "Otros deportes",
    count: "NBA · MLB · F1",
    statement:
      "Basket, béisbol, F1 y más. Lo que el resto no consigue, M90 sí.",
    photo: UNSPLASH.otros,
  },
];

export function Categories() {
  const [active, setActive] = useState(0);
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const photoWrapRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const wrap = photoWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / rect.width;
    const ny = (e.clientY - cy) / rect.height;
    setCursorOffset({ x: nx * 22, y: ny * 10 });
  }, []);

  // The item whose center is nearest the 50% viewport line is "active".
  // No hiding, no line-mask — all words stay visible, only the active one
  // flips to the accent color.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const target = window.innerHeight * 0.5;
      let bestIdx = 0;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - target);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActive(bestIdx);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="categorias"
      onMouseMove={handleMove}
      onMouseLeave={() => setCursorOffset({ x: 0, y: 0 })}
      className="relative bg-[color:var(--color-cream-soft)] py-24 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 60px, rgba(1,27,83,0.03) 60px 61px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        {/* Intro */}
        <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end">
          <div>
            <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red)]">
              <span className="h-px w-10 bg-[color:var(--color-red)]" />
              Las que apuestan por M90
            </div>
            <h2 className="mt-4 font-display text-5xl italic text-[color:var(--color-navy)] md:text-7xl">
              Seis mundos,
              <br />
              una tienda<span className="text-[color:var(--color-red)]">.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[color:var(--color-navy)]/70 md:justify-self-end">
            Desde los clásicos del fútbol hasta los jerseys de la NBA —
            seis mundos para ponerte la que te identifica.
          </p>
        </div>

        {/* 4-column layout — always horizontal nowrap, mirrors ABCS.
            items-stretch so sticky columns get the full row height. */}
        <div className="grid grid-cols-12 items-stretch gap-3 md:gap-6">
          {/* Col 1: sticky label — hidden on mobile (ABCS u-hide-mobile-landscape) */}
          <div className="hidden md:block md:col-span-2">
            <div className="sticky top-28">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-navy)]/60">
                Las categorías
                <br />
                que mandan
              </div>
            </div>
          </div>

          {/* Col 2: names list — wider on mobile */}
          <ul className="col-span-7 md:col-span-4">
            {CATEGORIES.map((c, i) => {
              const isActive = i === active;
              return (
                <li
                  key={c.slug}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  data-idx={i}
                  className="group relative"
                >
                  <a
                    href={`#cat-${c.slug}`}
                    className="relative block py-4 md:py-8"
                  >
                    {/* Word — always visible, packed tight like ABCS.
                        Only the active one flips to red. */}
                    <span
                      className="block font-display italic leading-[0.95] text-[clamp(40px,8.5vw,120px)]"
                      style={{
                        color: isActive
                          ? "var(--color-red)"
                          : "var(--color-navy)",
                        transition: "color 500ms cubic-bezier(.22,1,.36,1)",
                      }}
                    >
                      {c.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Col 3: sticky photo — sticky wrapper has natural content height
              (not h-screen) so pinning range = column height − photo height,
              which exceeds the list's scroll distance. */}
          <div className="col-span-5 md:col-span-3">
            <div className="sticky top-[50vh]">
              <div style={{ transform: "translateY(-50%)" }}>
                <div
                  ref={photoWrapRef}
                  className="relative aspect-[4/5] w-full"
                  style={{
                    transform: `translate(${cursorOffset.x}px, ${cursorOffset.y}px) rotate(${cursorOffset.x * 0.05}deg)`,
                    transition: "transform 600ms cubic-bezier(.22,1,.36,1)",
                  }}
                >
                {CATEGORIES.map((c, i) => {
                  const isActive = i === active;
                  return (
                    <div
                      key={c.slug}
                      className="absolute inset-0 overflow-hidden rounded-xl"
                      style={{
                        transform: isActive
                          ? "translate(0%, 0%) rotate(0deg) scale(1, 1)"
                          : "translate(0%, -50%) rotate(-45deg) scale(0, 0)",
                        transformOrigin: "center center",
                        transition:
                          "transform 900ms cubic-bezier(.22,1,.36,1)",
                      }}
                    >
                      <img
                        src={c.photo}
                        alt={c.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: sticky statement — hidden on mobile (ABCS u-hide-mobile-landscape) */}
          <div className="hidden md:block md:col-span-3">
            <div className="sticky top-[50vh]">
              <div style={{ transform: "translateY(-50%)" }}>
                <div className="relative min-h-[200px] w-full">
                {CATEGORIES.map((c, i) => {
                  const isActive = i === active;
                  return (
                    <p
                      key={c.slug}
                      className="absolute inset-0 text-lg leading-relaxed text-[color:var(--color-navy)]"
                      style={{
                        transform: isActive
                          ? "translate(0,0) scale(1)"
                          : "translate(22%, 0) scale(0.8)",
                        opacity: isActive ? 1 : 0,
                        transition:
                          "transform 700ms cubic-bezier(.22,1,.36,1), opacity 500ms ease",
                      }}
                    >
                      <span className="mb-3 block h-px w-10 bg-[color:var(--color-red)]" />
                      {c.statement}
                    </p>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
