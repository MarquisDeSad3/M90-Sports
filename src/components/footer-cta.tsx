"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowUpRight, ArrowUp } from "lucide-react";
import { Logo } from "./logo";
import { ChatCard } from "./chat-card";
import { asset, cn, whatsappUrl } from "@/lib/utils";

/* --------------------- Brand social icons (inline SVG) --------------------- */

function IgIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FbIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21.95V13.5h2.85l.45-3.4h-3.3V7.95c0-.98.27-1.65 1.68-1.65h1.8V3.25c-.31-.04-1.38-.13-2.62-.13-2.6 0-4.38 1.58-4.38 4.5V10.1H7v3.4h2.98v8.45h3.52Z" />
    </svg>
  );
}
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.88a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.31z" />
    </svg>
  );
}
function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

type Social = {
  name: string;
  href: string;
  Icon: React.ComponentType<{ size?: number }>;
  accent: string;
};

const SOCIALS: Social[] = [
  {
    name: "Instagram",
    href: "https://www.instagram.com",
    Icon: IgIcon,
    accent: "#E1306C",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com",
    Icon: FbIcon,
    accent: "#1877F2",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com",
    Icon: TikTokIcon,
    accent: "#FF0050",
  },
  {
    name: "WhatsApp",
    href: whatsappUrl("Hola M90"),
    Icon: WaIcon,
    accent: "#25D366",
  },
];

/* --------------------- Glitch text (Cyrillic / Greek / Latin homoglyphs) --------------------- */

const HOMOGLYPHS: Record<string, string[]> = {
  A: ["А", "Λ", "Д", "Α"],
  B: ["В", "Б", "β"],
  C: ["С", "Ϲ", "Ҁ"],
  D: ["Đ", "Ð", "Ԁ"],
  E: ["Е", "Σ", "Ξ", "Ё", "Є"],
  F: ["Ƒ", "Ғ", "Φ"],
  G: ["Ԍ", "Ꮐ", "Ɠ"],
  H: ["Н", "Η", "Ħ"],
  I: ["І", "Ι", "Ї", "¡"],
  J: ["Ј", "ل"],
  K: ["К", "Κ", "Ҝ"],
  L: ["Ł", "Ꮮ", "լ"],
  M: ["М", "Μ", "Ϻ"],
  N: ["Ν", "И", "Й", "Ŋ"],
  O: ["О", "Ω", "Θ", "Ø", "Ф"],
  P: ["Р", "Ρ", "П"],
  Q: ["Ϙ", "Ԛ"],
  R: ["Я", "Ʀ", "Ř"],
  S: ["Ѕ", "Ꮥ", "Ƨ"],
  T: ["Т", "Τ", "Ţ"],
  U: ["Ц", "Υ", "Ʉ"],
  V: ["Ѵ", "ν", "Ѷ"],
  W: ["Ш", "Ψ", "Щ", "Ш"],
  X: ["Х", "Χ", "Ж"],
  Y: ["У", "Ψ", "Ү"],
  Z: ["Ʒ", "Ζ", "Ẕ"],
};

function GlitchText({
  text,
  interval = 140,
  stability = 0.88,
  className = "",
}: {
  text: string;
  interval?: number;
  stability?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const id = setInterval(() => {
      const next = text
        .split("")
        .map((c) => {
          if (Math.random() < stability) return c;
          const upper = c.toUpperCase();
          const options = HOMOGLYPHS[upper];
          if (!options) return c;
          return options[Math.floor(Math.random() * options.length)];
        })
        .join("");
      setDisplay(next);
    }, interval);
    return () => clearInterval(id);
  }, [text, interval, stability]);

  return (
    <span aria-label={text} className={className}>
      {display}
    </span>
  );
}

/* --------------------- Live Havana clock --------------------- */

function useHavanaTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date().toLocaleTimeString("es-CU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Havana",
      });
      setTime(now);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* --------------------- Footer --------------------- */

export function FooterCta() {
  const time = useHavanaTime();
  const line1 = Array.from("Ponte la");
  const line2 = Array.from("camiseta.");

  return (
    <footer className="relative overflow-hidden bg-[color:var(--color-navy-900)] text-[color:var(--color-cream)]">
      {/* Marquee ribbon */}
      <div className="relative overflow-hidden border-y border-white/5 bg-[color:var(--color-red)] py-4 md:py-5">
        <div className="flex whitespace-nowrap animate-[m90-marquee_38s_linear_infinite]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-6 px-6 font-display text-2xl italic text-[color:var(--color-cream)] md:text-3xl"
            >
              <span>Escríbenos ahora</span>
              <span aria-hidden className="text-[color:var(--color-cream)]/60">
                ✱
              </span>
              <span>Envíos a toda Cuba</span>
              <span aria-hidden className="text-[color:var(--color-cream)]/60">
                ✱
              </span>
              <span>WhatsApp 24/7</span>
              <span aria-hidden className="text-[color:var(--color-cream)]/60">
                ✱
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Big CTA with letter-by-letter reveal */}
      <div className="relative py-28 md:py-40">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url(${asset("/patterns/m90-pattern-cream.webp")})`,
            backgroundSize: "340px auto",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
          <div className="flex flex-col items-start gap-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red-bright)]">
                <span className="h-px w-10 bg-[color:var(--color-red-bright)]" />
                Y hasta aquí
              </div>

              <h2 className="mt-6 font-display text-[clamp(56px,11vw,180px)] italic leading-[0.88]">
                <span className="block">
                  {line1.map((ch, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 80, rotate: 6 }}
                      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        delay: i * 0.03,
                        duration: 0.85,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block whitespace-pre"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
                <span className="block text-[color:var(--color-red-bright)]">
                  {line2.map((ch, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 80, rotate: -6 }}
                      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        delay: 0.35 + i * 0.035,
                        duration: 0.85,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block whitespace-pre"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
              </h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-8 max-w-md text-base leading-relaxed text-[color:var(--color-cream)]/70"
              >
                Elige tu equipo, nos escribes por WhatsApp y te la enviamos a
                cualquier provincia de Cuba. Sin vueltas.
              </motion.p>
            </div>

            {/* Live WhatsApp-style chat — rotates through real client scenarios */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full shrink-0 lg:w-auto"
            >
              <ChatCard />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ====== CLEAN FOOTER (glitch + socials + legal) ====== */}
      <div className="relative overflow-hidden border-t border-white/5 pt-16 pb-8 md:pt-24 md:pb-12">

        {/* Center content */}
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-5 text-center md:px-10">
          <Logo
            variant="cream"
            className="text-[48px] justify-center md:text-[56px]"
          />

          {/* Glitch tagline */}
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.32em] text-[color:var(--color-cream)]/60 md:text-xs">
            <GlitchText
              text="FUTBOL · NBA · RETRO · CUBA · 2020"
              interval={130}
              stability={0.9}
            />
          </div>

          {/* Socials */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {SOCIALS.map((s) => (
              <SocialTile key={s.name} social={s} />
            ))}
          </div>

          {/* Quick links with glitch on hover */}
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {[
              { label: "Catálogo", href: "#catalogo" },
              { label: "Categorías", href: "#categorias" },
              { label: "Cómo comprar", href: "#como-comprar" },
              { label: "Envíos", href: "#envios" },
              { label: "FAQ", href: "#faq" },
              { label: "Reseñas", href: "#resenas" },
            ].map((l) => (
              <GlitchLink key={l.href} href={l.href} label={l.label} />
            ))}
          </nav>

          {/* Brand statement */}
          <p className="mt-10 max-w-sm font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-cream)]/40 md:text-[11px]">
            <GlitchText
              text="Camisetas de verdad · toda Cuba · hecho con ritmo cubano"
              interval={180}
              stability={0.94}
            />
          </p>
        </div>

        {/* Legal bar */}
        <div className="relative mx-auto mt-12 w-full max-w-[1400px] border-t border-white/5 px-5 pt-6 md:px-10">
          <div className="flex flex-col items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-cream)]/35 md:flex-row">
            <span>
              © {new Date().getFullYear()} M90 Sports · La Habana{" "}
              {time ? `· ${time}` : ""}
            </span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2 transition-colors hover:text-[color:var(--color-red-bright)]"
            >
              <ArrowUp
                size={12}
                className="transition-transform duration-500 group-hover:-translate-y-0.5"
              />
              Volver arriba
            </button>
          </div>
        </div>

        {/* Giant wordmark — spotlight reveal on hover/touch (inspired by Morphic) */}
        <FooterWordmark />
      </div>

      {/* Marquee keyframe */}
      <style>{`
        @keyframes m90-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </footer>
  );
}

/* --------------------- Social tile (subtle, brand accent on hover) --------------------- */

function SocialTile({ social }: { social: Social }) {
  const { name, href, Icon, accent } = social;
  const ref = useRef<HTMLAnchorElement>(null);

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={name}
      className="group/tile relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-[color:var(--color-cream)]/70 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 12px 32px -10px ${accent}99, 0 0 0 1px ${accent}30 inset`;
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.color = "";
      }}
    >
      <Icon size={16} />
    </a>
  );
}

/* --------------------- Glitch link (text swaps homoglyphs on hover) --------------------- */

function GlitchLink({ href, label }: { href: string; label: string }) {
  const [display, setDisplay] = useState(label);
  const intervalRef = useRef<number | null>(null);

  function start() {
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(() => {
      const next = label
        .split("")
        .map((c) => {
          if (Math.random() < 0.55) return c;
          const options = HOMOGLYPHS[c.toUpperCase()];
          return options
            ? options[Math.floor(Math.random() * options.length)]
            : c;
        })
        .join("");
      setDisplay(next);
    }, 60);
  }

  function stop() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplay(label);
  }

  useEffect(() => () => stop(), []);

  return (
    <a
      href={href}
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group relative inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-cream)]/75 transition-colors hover:text-[color:var(--color-red-bright)]"
      aria-label={label}
    >
      <span className="font-mono">{display}</span>
    </a>
  );
}

/* --------------------- Giant wordmark with spotlight reveal --------------------- */

function WordmarkContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[0.03em] px-4 text-[color:var(--color-cream)]",
        className,
      )}
    >
      <img
        src={asset("/brand/m90-cream.png")}
        alt=""
        draggable={false}
        className="h-[clamp(70px,11vw,170px)] w-auto select-none"
      />
      <span
        className="font-display italic leading-none tracking-[-0.02em]"
        style={{ fontSize: "clamp(95px, 14.5vw, 225px)" }}
      >
        SPORTS
      </span>
    </div>
  );
}

function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [active, setActive] = useState(false);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative mt-10 w-full overflow-hidden pt-6"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)",
      }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <div className="relative">
        {/* Base dim layer */}
        <WordmarkContent className="opacity-[0.22]" />

        {/* Bright layer — revealed by the cursor spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: active ? 1 : 0,
            WebkitMaskImage: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)`,
            maskImage: `radial-gradient(380px circle at ${pos.x}px ${pos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)`,
          }}
        >
          <WordmarkContent />
        </div>
      </div>
    </div>
  );
}
