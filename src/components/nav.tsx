"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { X, MessageCircle, ArrowUpRight, ShoppingBag } from "lucide-react";
import { Logo } from "./logo";
import { asset, cn, whatsappUrl } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";

const LINKS = [
  { href: "#catalogo", label: "Catálogo", num: "01" },
  { href: "#categorias", label: "Categorías", num: "02" },
  { href: "#como-comprar", label: "Cómo comprar", num: "03" },
  { href: "#envios", label: "Envíos", num: "04" },
  { href: "#faq", label: "FAQ", num: "05" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const { count, dispatch } = useCart();

  useEffect(() => {
    let prev = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // hide when scrolling down past 400px, show again on scroll up
      setHidden(y > 400 && y > prev + 2);
      prev = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -120 : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50"
      >
        {/* Floating container — full-width when at top, pill when scrolled */}
        <div
          className={cn(
            "mx-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled
              ? "mt-3 max-w-[1360px] px-3 md:px-4"
              : "mt-0 max-w-[1400px] px-5 md:px-10",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled
                ? "rounded-full border border-[color:var(--color-navy)]/10 bg-[color:var(--color-cream-soft)]/90 px-5 py-2.5 shadow-[0_12px_44px_-22px_rgba(1,27,83,0.4)] backdrop-blur-xl md:px-6"
                : "border-b border-transparent py-4 md:py-5",
            )}
          >
            {/* Logo block */}
            <a href="#top" className="group flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -6, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <Logo
                  variant="navy"
                  className="text-[26px] md:text-[30px]"
                />
              </motion.div>
              <span className="hidden md:block h-6 w-px bg-[color:var(--color-navy)]/25" />
              <div className="hidden leading-[1.3] md:block">
                <div className="text-[9px] font-semibold tracking-[0.3em] text-[color:var(--color-navy)]/75">
                  TIENDA DEPORTIVA
                </div>
                <div className="text-[9px] font-semibold tracking-[0.3em] text-[color:var(--color-red)]">
                  CUBA · 2020
                </div>
              </div>
            </a>

            {/* Desktop nav — numbered links with text-flip hover */}
            <nav className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.05,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-navy)]"
                >
                  <span className="text-[9px] font-mono text-[color:var(--color-red)]/70">
                    {l.num}
                  </span>
                  <span className="relative block overflow-hidden">
                    <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                      {l.label}
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-0 translate-y-full text-[color:var(--color-red)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    >
                      {l.label}
                    </span>
                  </span>
                </motion.a>
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              {/* Cart button — always visible with badge */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                onClick={() => dispatch({ type: "OPEN" })}
                className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--color-navy)]/20 bg-white/60 px-3 text-[color:var(--color-navy)] backdrop-blur transition-all hover:border-[color:var(--color-navy)] hover:bg-[color:var(--color-navy)] hover:text-[color:var(--color-cream)]"
                aria-label="Abrir carrito"
              >
                <ShoppingBag
                  size={15}
                  className="transition-transform duration-500 group-hover:-translate-y-px group-hover:scale-110"
                />
                <AnimatePresence>
                  {count > 0 ? (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-[color:var(--color-red)] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(152,14,33,0.5)]"
                    >
                      {count}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>

              <motion.a
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                href={whatsappUrl("Hola M90, me interesa una camiseta.")}
                target="_blank"
                rel="noreferrer"
                className="group relative hidden overflow-hidden rounded-full bg-[color:var(--color-navy)] text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-cream)] md:inline-flex"
              >
                <span className="absolute inset-0 -translate-x-full bg-[color:var(--color-red)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center gap-2 px-5 py-2.5">
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-500 group-hover:rotate-45"
                  />
                </span>
              </motion.a>

              {/* Hamburger — 2 lines that morph */}
              <button
                onClick={() => setOpen(true)}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-navy)]/20 bg-white/60 text-[color:var(--color-navy)] backdrop-blur transition-all hover:border-[color:var(--color-navy)] hover:bg-[color:var(--color-navy)] hover:text-[color:var(--color-cream)] lg:hidden"
                aria-label="Abrir menú"
              >
                <div className="flex flex-col items-center gap-[5px]">
                  <span className="block h-[1.5px] w-4 bg-current transition-transform duration-300 group-hover:-translate-y-px group-hover:w-5" />
                  <span className="block h-[1.5px] w-3 bg-current transition-all duration-300 group-hover:w-5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll progress — visible only when full-width (not pill) */}
        <motion.div
          style={{ scaleX: progressScale }}
          animate={{ opacity: scrolled ? 0 : 1 }}
          className="h-[2px] origin-left bg-[color:var(--color-red)] transition-opacity duration-300"
        />
      </motion.header>

      <AnimatePresence>
        {open ? <MobileDrawer onClose={() => setOpen(false)} /> : null}
      </AnimatePresence>
    </>
  );
}

/* --------------------- Mobile drawer (polished) --------------------- */

function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] lg:hidden"
    >
      {/* Backdrop */}
      <motion.button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-label="Cerrar menú"
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-hidden bg-[color:var(--color-navy)] text-[color:var(--color-cream)]"
      >
        {/* Pattern bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url(${asset("/patterns/m90-pattern-cream.webp")})`,
            backgroundSize: "300px auto",
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5">
          <Logo variant="cream" className="text-[28px]" />
          <button
            onClick={onClose}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-all hover:bg-[color:var(--color-red)] hover:border-[color:var(--color-red)]"
            aria-label="Cerrar"
          >
            <X
              size={18}
              className="transition-transform duration-500 group-hover:rotate-90"
            />
          </button>
        </div>

        {/* Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative px-6 pt-8 pb-2"
        >
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.32em] text-[color:var(--color-red-bright)]">
            <span className="h-px w-6 bg-[color:var(--color-red-bright)]" />
            EXPLORA M90
          </div>
        </motion.div>

        <nav className="relative flex flex-1 flex-col gap-0 px-6 pb-4 pt-2">
          {LINKS.map((l, i) => (
            <motion.a
              key={l.href}
              href={l.href}
              onClick={onClose}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.2 + i * 0.07,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex items-baseline justify-between overflow-hidden border-b border-white/10 py-4 font-display text-[40px] italic leading-none"
            >
              {/* sliding red accent bar */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-[color:var(--color-red-bright)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
              />
              <span className="flex items-baseline gap-3 pl-3 transition-colors duration-500 group-hover:text-[color:var(--color-red-bright)]">
                <span className="font-mono text-[11px] tracking-[0.3em] text-[color:var(--color-red-bright)]/70 not-italic">
                  {l.num}
                </span>
                {l.label}
              </span>
              <ArrowUpRight
                size={22}
                className="text-[color:var(--color-cream)]/30 transition-all duration-500 group-hover:rotate-45 group-hover:text-[color:var(--color-red-bright)]"
              />
            </motion.a>
          ))}
        </nav>

        {/* Socials + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative border-t border-white/10 p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-cream)]/50">
              Síguenos
            </div>
            <div className="flex gap-2">
              <MiniSocial href="https://www.instagram.com" label="Instagram">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </MiniSocial>
              <MiniSocial href="https://www.facebook.com" label="Facebook">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M13.5 21.95V13.5h2.85l.45-3.4h-3.3V7.95c0-.98.27-1.65 1.68-1.65h1.8V3.25c-.31-.04-1.38-.13-2.62-.13-2.6 0-4.38 1.58-4.38 4.5V10.1H7v3.4h2.98v8.45h3.52Z" />
                </svg>
              </MiniSocial>
              <MiniSocial href="https://www.tiktok.com" label="TikTok">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.88a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.31z" />
                </svg>
              </MiniSocial>
            </div>
          </div>
          <a
            href={whatsappUrl("Hola M90, quiero más info.")}
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-red)] px-6 py-4 text-sm font-bold uppercase tracking-wider text-white"
          >
            <span className="absolute inset-0 -translate-x-full bg-[color:var(--color-red-bright)] transition-transform duration-500 group-hover:translate-x-0" />
            <MessageCircle size={16} className="relative z-10" />
            <span className="relative z-10">Pedir por WhatsApp</span>
            <ArrowUpRight
              size={16}
              className="relative z-10 transition-transform duration-500 group-hover:rotate-45"
            />
          </a>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
}

function MiniSocial({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-[color:var(--color-cream)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-red-bright)] hover:bg-[color:var(--color-red)]"
    >
      <span className="transition-transform duration-500 group-hover:scale-110">
        {children}
      </span>
    </a>
  );
}
