"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { asset } from "@/lib/utils";

type Product = {
  id: string;
  team: string;
  name: string;
  season: string;
  price: number;
  tag: "nuevo" | "retro" | "kids" | "limitada" | null;
  colors: string[];
  category: "clubes" | "selecciones" | "retro" | "nba" | "ninos";
  photo: string;
};

// Reusing the same Unsplash references used elsewhere on the site.
const PHOTO = {
  clubes: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80",
  selecciones:
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=900&q=80",
  retro: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900&q=80",
  nba: "https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=900&q=80",
};

const PRODUCTS: Product[] = [
  {
    id: "real-madrid-local-25-26",
    team: "Real Madrid",
    name: "Local 25/26",
    season: "Temporada actual",
    price: 45,
    tag: "nuevo",
    colors: ["#ffffff", "#0b1a48"],
    category: "clubes",
    photo: PHOTO.clubes,
  },
  {
    id: "argentina-3-estrellas",
    team: "Argentina",
    name: "3 estrellas",
    season: "Post-Mundial",
    price: 50,
    tag: "nuevo",
    colors: ["#6cb4ee", "#ffffff"],
    category: "selecciones",
    photo: PHOTO.selecciones,
  },
  {
    id: "barcelona-away-25-26",
    team: "Barcelona",
    name: "Away 25/26",
    season: "Temporada actual",
    price: 45,
    tag: null,
    colors: ["#f4d35e", "#8a1538"],
    category: "clubes",
    photo: PHOTO.clubes,
  },
  {
    id: "juventus-retro-96-97",
    team: "Juventus",
    name: "Retro 96/97",
    season: "Del Piero era",
    price: 55,
    tag: "retro",
    colors: ["#111111", "#ffffff"],
    category: "retro",
    photo: PHOTO.retro,
  },
  {
    id: "lakers-kobe-24",
    team: "Lakers",
    name: "Kobe #24",
    season: "Clásica",
    price: 60,
    tag: "limitada",
    colors: ["#552583", "#fdb927"],
    category: "nba",
    photo: PHOTO.nba,
  },
  {
    id: "brasil-home-24",
    team: "Brasil",
    name: "Home 24",
    season: "Copa América",
    price: 50,
    tag: null,
    colors: ["#ffde00", "#009c3b"],
    category: "selecciones",
    photo: PHOTO.selecciones,
  },
  {
    id: "psg-third-25-26",
    team: "PSG",
    name: "Third 25/26",
    season: "Temporada actual",
    price: 48,
    tag: "nuevo",
    colors: ["#004170", "#d00027"],
    category: "clubes",
    photo: PHOTO.clubes,
  },
  {
    id: "cuba-edicion-m90",
    team: "Cuba",
    name: "Edición M90",
    season: "Exclusiva",
    price: 42,
    tag: "limitada",
    colors: ["#cf142b", "#ffffff", "#002a8f"],
    category: "selecciones",
    photo: PHOTO.selecciones,
  },
];

const FILTERS = [
  { id: "todo", label: "Todo" },
  { id: "clubes", label: "Clubes" },
  { id: "selecciones", label: "Selecciones" },
  { id: "retro", label: "Retro" },
  { id: "nba", label: "NBA" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const SIZES = ["S", "M", "L", "XL"] as const;

export function Catalog() {
  const [filter, setFilter] = useState<FilterId>("todo");
  const list =
    filter === "todo" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  return (
    <section
      id="catalogo"
      className="relative overflow-hidden bg-[color:var(--color-navy)] py-24 text-[color:var(--color-cream)] md:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url(${asset("/patterns/m90-pattern-cream.webp")})`,
          backgroundSize: "380px auto",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red-bright)]">
              <span className="h-px w-10 bg-[color:var(--color-red-bright)]" />
              Destacados de la semana
            </div>
            <h2 className="mt-4 font-display text-5xl italic md:text-7xl">
              Lo que se está
              <br />
              yendo volando.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[color:var(--color-cream)]/70">
            Elige talla, agrega al carrito y cuando termines mandas tu pedido
            completo por WhatsApp.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                filter === f.id
                  ? "border-[color:var(--color-red-bright)] bg-[color:var(--color-red-bright)] text-white"
                  : "border-white/20 bg-white/5 text-[color:var(--color-cream)] hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <p className="max-w-md text-sm text-[color:var(--color-cream)]/70">
            Estás viendo los 8 destacados de esta semana. El catálogo completo
            se despliega más abajo.
          </p>
          <button
            className="group inline-flex items-center gap-3 rounded-full border border-[color:var(--color-cream)]/30 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-widest text-[color:var(--color-cream)] backdrop-blur transition-colors hover:bg-white/10"
            type="button"
          >
            Cargar más camisetas
            <span className="text-[color:var(--color-red-bright)] transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------- ProductCard -------------------- */

function ProductCard({ product: p, index: i }: { product: Product; index: number }) {
  const { dispatch } = useCart();
  const [size, setSize] = useState<(typeof SIZES)[number]>("M");
  const [added, setAdded] = useState(false);

  function addToCart() {
    dispatch({
      type: "ADD",
      item: {
        id: p.id,
        team: p.team,
        name: p.name,
        season: p.season,
        size,
        price: p.price,
        photo: p.photo,
      },
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (i % 4) * 0.05 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[color:var(--color-navy-900)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--color-navy-700)]">
        <Jersey colors={p.colors} team={p.team} />
        {p.tag ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              p.tag === "nuevo"
                ? "bg-[color:var(--color-green)] text-[color:var(--color-navy)]"
                : p.tag === "retro"
                  ? "bg-[color:var(--color-cream)] text-[color:var(--color-navy)]"
                  : p.tag === "kids"
                    ? "bg-white text-[color:var(--color-navy)]"
                    : "bg-[color:var(--color-red-bright)] text-white"
            }`}
          >
            {p.tag}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-cream)]/45">
              {p.season}
            </div>
            <h3 className="mt-0.5 truncate font-display text-lg italic leading-tight md:text-xl">
              {p.team}
            </h3>
            <p className="truncate text-xs text-[color:var(--color-cream)]/70">
              {p.name}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-xl italic text-[color:var(--color-red-bright)] md:text-2xl">
              ${p.price}
            </div>
          </div>
        </div>

        {/* Size pills */}
        <div className="flex items-center gap-1">
          {SIZES.map((s) => {
            const active = s === size;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h-7 w-8 rounded-full text-[10px] font-bold transition-colors ${
                  active
                    ? "bg-[color:var(--color-cream)] text-[color:var(--color-navy)]"
                    : "bg-white/5 text-[color:var(--color-cream)]/70 hover:bg-white/10"
                }`}
                aria-label={`Talla ${s}`}
                aria-pressed={active}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Add-to-cart */}
        <button
          onClick={addToCart}
          className="group/btn relative mt-auto flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-red)] py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-all"
          disabled={added}
        >
          <span className="absolute inset-0 -translate-x-full bg-[color:var(--color-green)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-0" />
          <span className="relative z-10 flex items-center gap-2">
            {added ? (
              <>
                <Check size={14} />
                Agregado
              </>
            ) : (
              <>
                <Plus
                  size={14}
                  className="transition-transform duration-500 group-hover/btn:rotate-90"
                />
                Agregar
              </>
            )}
          </span>
        </button>
      </div>
    </motion.article>
  );
}

/* -------------------- Jersey visual -------------------- */

function Jersey({ colors, team }: { colors: string[]; team: string }) {
  const [main, second, third] = [
    colors[0],
    colors[1] ?? colors[0],
    colors[2] ?? colors[1] ?? colors[0],
  ];
  return (
    <div className="relative h-full w-full" style={{ background: main }}>
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2"
        style={{
          width: "32%",
          background: `repeating-linear-gradient(90deg, ${main} 0 14px, ${second} 14px 28px)`,
          opacity: 0.9,
        }}
      />
      <div
        className="absolute left-0 top-0 h-2/5 w-1/4 -skew-y-12"
        style={{ background: third, opacity: 0.9 }}
      />
      <div
        className="absolute right-0 top-0 h-2/5 w-1/4 skew-y-12"
        style={{ background: third, opacity: 0.9 }}
      />
      <div
        className="absolute left-1/2 top-0 h-8 w-16 -translate-x-1/2 rounded-b-full"
        style={{ background: "rgba(0,0,0,0.25)" }}
      />
      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center text-center">
        <span
          className="font-display text-[11px] italic uppercase tracking-[0.3em]"
          style={{
            color: second === "#ffffff" ? main : "#ffffff",
            mixBlendMode: "difference",
          }}
        >
          {team}
        </span>
        <span
          className="mt-1 font-display text-5xl italic"
          style={{
            color: second === "#ffffff" ? main : "#ffffff",
            mixBlendMode: "difference",
          }}
        >
          90
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}
