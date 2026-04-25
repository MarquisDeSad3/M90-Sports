"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { asset } from "@/lib/utils";

const PHOTOS = {
  left: {
    src: asset("/hero/hero-left.jpg"),
    alt: "Cliente con camiseta Philadelphia Union vintage",
  },
  center: {
    src: asset("/hero/hero-center.webp"),
    alt: "Cliente con camiseta Manchester United Sharp vintage",
  },
  right: {
    src: asset("/hero/hero-right.jpg"),
    alt: "Cliente con camiseta Philadelphia Union BIMBO",
  },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  /* Letters drift toward center on scroll */
  const m90X = useTransform(scrollYProgress, [0, 1], ["0vw", "8vw"]);
  const sportsX = useTransform(scrollYProgress, [0, 1], ["0vw", "-8vw"]);

  /* Fan effect: laterals emerge from behind center and splay with scroll */
  const leftFanX = useTransform(scrollYProgress, [0, 0.65], ["60%", "0%"]);
  const leftFanRot = useTransform(scrollYProgress, [0, 0.65], [2, -10]);
  const rightFanX = useTransform(scrollYProgress, [0, 0.65], ["-60%", "0%"]);
  const rightFanRot = useTransform(scrollYProgress, [0, 0.65], [-2, 10]);

  /* Small Y parallax for the center photo (subtle life) */
  const centerPhotoY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  /* Min clamps kept small so mobile (~375px) shows the whole word on-screen. */
  const M90_FONT = "clamp(56px, 16vw, 300px)";
  const SPORTS_FONT = "clamp(44px, 12vw, 240px)";

  return (
    <section
      ref={ref}
      id="top"
      className="relative bg-white text-[color:var(--color-navy)]"
      style={{ height: "500svh" }}
    >
      <div className="sticky top-0 isolate flex h-[100svh] flex-col overflow-hidden">
        {/* ============ LAYER 1 (z=10) — SOLID letters (behind photos) ============ */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Mobile: M90 + SPORTS stacked centered over photos (Gradwear layout) */}
          <div className="absolute inset-x-0 top-[40%] flex -translate-y-1/2 flex-col items-center px-5 md:hidden">
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em] text-[color:var(--color-red)]"
              style={{ fontSize: M90_FONT }}
            >
              M90
            </span>
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em] text-[color:var(--color-navy)]"
              style={{ fontSize: SPORTS_FONT, marginTop: "-0.08em" }}
            >
              SPORTS
            </span>
          </div>

          {/* Desktop: M90 top-left, drifts toward center */}
          <motion.div
            style={{ x: m90X }}
            className="hidden md:block absolute left-0 top-[14svh] md:px-10"
          >
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em] text-[color:var(--color-red)]"
              style={{ fontSize: M90_FONT }}
            >
              M90
            </span>
          </motion.div>

          {/* Desktop: SPORTS bottom-right, drifts toward center */}
          <motion.div
            style={{ x: sportsX }}
            className="hidden md:block absolute right-0 bottom-[18svh] md:px-10"
          >
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em] text-[color:var(--color-navy)]"
              style={{ fontSize: SPORTS_FONT }}
            >
              SPORTS
            </span>
          </motion.div>
        </div>

        {/* ============ LAYER 2 (z=20) — PHOTOS (always visible) ============ */}
        <div className="pointer-events-none absolute inset-x-0 top-[40%] z-20 flex -translate-y-1/2 items-center justify-center px-4 md:top-1/2">
          <div className="relative flex items-end justify-center">
            {/* Left lateral — fan effect: tucked at start, splays outward with scroll */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              style={{ x: leftFanX, rotate: leftFanRot }}
              className="relative mr-[-8%] aspect-[7/9] h-[32svh] md:h-[min(56svh,480px)] shrink-0 origin-bottom-right"
            >
              <SkewFrame src={PHOTOS.left.src} alt={PHOTOS.left.alt} />
            </motion.div>

            {/* Center — protagonist */}
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ y: centerPhotoY }}
              className="relative z-[2] aspect-[7/9] h-[42svh] md:h-[min(70svh,600px)] shrink-0"
            >
              <SkewFrame src={PHOTOS.center.src} alt={PHOTOS.center.alt} />
            </motion.div>

            {/* Right lateral — fan effect: tucked at start, splays outward with scroll */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              style={{ x: rightFanX, rotate: rightFanRot }}
              className="relative ml-[-8%] aspect-[7/9] h-[32svh] md:h-[min(56svh,480px)] shrink-0 origin-bottom-left"
            >
              <SkewFrame src={PHOTOS.right.src} alt={PHOTOS.right.alt} />
            </motion.div>
          </div>
        </div>

        {/* ============ LAYER 3 (z=30) — OUTLINE letters (on top of photos) ============
             Synced with solid layer via same m90X / sportsX.
             mix-blend-mode: difference → stroke inverts against whatever pixels are behind,
             so the contour always reads against photos (or the solid layer on white bg). */}
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{ mixBlendMode: "difference" }}
        >
          {/* Mobile outline: M90 + SPORTS stacked centered over photos */}
          <div className="absolute inset-x-0 top-[40%] flex -translate-y-1/2 flex-col items-center px-5 md:hidden">
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em]"
              style={{
                fontSize: M90_FONT,
                color: "transparent",
                WebkitTextStroke: "2px #ffffff",
              }}
            >
              M90
            </span>
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em]"
              style={{
                fontSize: SPORTS_FONT,
                color: "transparent",
                WebkitTextStroke: "2px #ffffff",
                marginTop: "-0.08em",
              }}
            >
              SPORTS
            </span>
          </div>

          {/* Desktop outline: synced with solid layer */}
          <motion.div
            style={{ x: m90X }}
            className="hidden md:block absolute left-0 top-[14svh] md:px-10"
          >
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em]"
              style={{
                fontSize: M90_FONT,
                color: "transparent",
                WebkitTextStroke: "2px #ffffff",
              }}
            >
              M90
            </span>
          </motion.div>

          <motion.div
            style={{ x: sportsX }}
            className="hidden md:block absolute right-0 bottom-[18svh] md:px-10"
          >
            <span
              aria-hidden
              className="block font-display italic leading-[0.82] tracking-[-0.02em]"
              style={{
                fontSize: SPORTS_FONT,
                color: "transparent",
                WebkitTextStroke: "2px #ffffff",
              }}
            >
              SPORTS
            </span>
          </motion.div>
        </div>

        {/* ============ BOTTOM BAR — socials · EXPLORAR · stamp (3-col Gradwear) ============ */}
        <div className="absolute inset-x-0 bottom-[10svh] z-40 mx-auto w-full max-w-[1400px] px-5 pb-2 md:bottom-0 md:px-10 md:pb-10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05, duration: 0.5 }}
              className="flex items-center justify-start gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-navy)]/75"
            >
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[color:var(--color-red)]"
              >
                IG
              </a>
              <span className="h-3 w-px bg-[color:var(--color-navy)]/25" />
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[color:var(--color-red)]"
              >
                FB
              </a>
              <span className="h-3 w-px bg-[color:var(--color-navy)]/25" />
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[color:var(--color-red)]"
              >
                TIK
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="flex items-center justify-center"
            >
              <a
                href="#catalogo"
                className="group inline-flex items-center gap-2 font-display text-xl italic text-[color:var(--color-navy)] md:gap-3 md:text-3xl"
              >
                EXPLORAR
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-cream)] transition-transform group-hover:translate-y-1 md:h-10 md:w-10">
                  <ArrowDown size={14} className="md:hidden" />
                  <ArrowDown size={18} className="hidden md:block" />
                </span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="hidden items-center justify-end md:flex"
            >
              <div className="relative grid h-24 w-24 place-items-center">
                <svg
                  className="absolute inset-0 h-full w-full animate-[spin_22s_linear_infinite]"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <path
                      id="stamp-circle"
                      d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                  </defs>
                  <text
                    fill="var(--color-navy)"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="2"
                  >
                    <textPath href="#stamp-circle">
                      · TIENDA DEPORTIVA · CUBA · 2020 ·
                    </textPath>
                  </text>
                </svg>
                <img
                  src={asset("/brand/m90-red.png")}
                  alt="M90"
                  draggable={false}
                  className="relative h-5 w-auto select-none md:h-6"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Trapezoidal photo frame (top-right skew, Gradwear-style).
 * Outer skewY deforms the bounding box, inner counter-skew keeps the photo upright.
 */
function SkewFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-md shadow-[0_30px_80px_-20px_rgba(1,27,83,0.4)] ring-1 ring-[color:var(--color-navy)]/8"
      style={{ transform: "skewY(-6deg)" }}
    >
      <div
        className="relative h-full w-full"
        style={{ transform: "skewY(6deg) scale(1.2)" }}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
}
