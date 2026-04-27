import type { Metadata } from "next"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import {
  getPublicPreorderProducts,
  getPublicPreorderSubcategories,
} from "@/lib/queries/public-preorders"
import { PorEncargoClient } from "@/components/public/por-encargo-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Por encargo · M90 Sports",
  description:
    "Catálogo completo de jerseys, accesorios y retro por encargo. Búscalo, elige y te lo cotizamos por WhatsApp.",
}

const M90_NAVY = "#011b53"

export default async function PorEncargoPage() {
  const [products, subcategories] = await Promise.all([
    getPublicPreorderProducts(),
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
            {products.length.toLocaleString("es-CU")} productos disponibles por
            encargo: clubes, selecciones, NBA, retro y más. Filtra por
            categoría, busca por equipo y consulta el precio por WhatsApp.
          </p>
        </div>
      </section>

      <PorEncargoClient products={products} subcategories={subcategories} />

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-10 text-center md:px-8">
        <p className="text-xs text-[#011b53]/55">
          © 2026 M90 Sports · Catálogo por encargo
        </p>
      </footer>

      <WhatsappFloat />
    </main>
  )
}
