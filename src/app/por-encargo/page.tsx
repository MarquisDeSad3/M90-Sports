import type { Metadata } from "next"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import {
  getPublicPreorderPage,
  getPublicPreorderSubcategories,
} from "@/lib/queries/public-preorders"
import { PorEncargoClient } from "@/components/public/por-encargo-client"

// Cache the page output for 60s — the catalog is large enough that
// hammering the DB on every request would be wasteful, but small
// enough that a one-minute lag is acceptable when Ever publishes.
export const revalidate = 60

export const metadata: Metadata = {
  title: "Por encargo",
  description:
    "Catálogo completo de jerseys, accesorios y retro por encargo. Búscalo, elige y te lo cotizamos por WhatsApp.",
  alternates: { canonical: "/por-encargo" },
  openGraph: {
    title: "Por encargo · M90 Sports",
    description:
      "Lo que no tenemos en stock, te lo conseguimos. Selecciones, clubes, NBA, retro y más.",
    url: "/por-encargo",
    type: "website",
  },
}

const M90_NAVY = "#011b53"
const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{ page?: string; cat?: string; q?: string }>
}

export default async function PorEncargoPage({ searchParams }: PageProps) {
  const { page: rawPage, cat: rawCat, q: rawQ } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const cat = rawCat?.trim() || null
  const q = rawQ?.trim() || ""

  const [data, subcategories] = await Promise.all([
    getPublicPreorderPage({
      page,
      pageSize: PAGE_SIZE,
      categoryId: cat,
      search: q,
    }),
    getPublicPreorderSubcategories(),
  ])

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-28 pb-6 md:px-8 md:pt-32 md:pb-8">
        <div className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(1,27,83,0.15)] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#011b53]/75">
            Por encargo
          </span>
          <h1
            className="font-display text-3xl leading-[0.95] tracking-tight md:text-5xl"
            style={{ color: M90_NAVY }}
          >
            Lo que no tenemos en stock,{" "}
            <span style={{ color: "#980e21" }}>te lo conseguimos</span>.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#011b53]/75 md:text-base">
            Filtra por categoría, busca por equipo y consulta el precio por
            WhatsApp.
          </p>
        </div>
      </section>

      <PorEncargoClient
        products={data.products}
        total={data.total}
        page={page}
        pageSize={PAGE_SIZE}
        activeCategory={cat}
        searchQuery={q}
        subcategories={subcategories}
      />

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-10 text-center md:px-8">
        <p className="text-xs text-[#011b53]/55">
          © 2026 M90 Sports · Catálogo por encargo
        </p>
      </footer>

      <WhatsappFloat />
    </main>
  )
}
