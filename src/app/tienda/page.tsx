import type { Metadata } from "next"
import { Nav } from "@/components/nav"
import { TiendaCatalog } from "@/components/public/tienda-catalog"
import { getPublicProducts } from "@/lib/queries/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Catálogo M90 Sports: jerseys NBA, fútbol, retro y selecciones, entregados a toda Cuba. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.",
  alternates: { canonical: "/tienda" },
  openGraph: {
    title: "Tienda · M90 Sports",
    description:
      "Catálogo M90 Sports: jerseys NBA, fútbol, retro y selecciones — Cuba.",
    url: "/tienda",
    type: "website",
  },
}

const M90_NAVY = "#011b53"

export default async function TiendaPage() {
  const products = await getPublicProducts()

  return (
    <main className="relative min-h-svh bg-[#f7ebc8]" style={{ color: M90_NAVY }}>
      <Nav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-28 pb-10 md:px-8 md:pt-32 md:pb-14">
        <div className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(1,27,83,0.15)] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#011b53]/75">
            Tienda M90 Sports
          </span>
          <h1
            className="font-display text-4xl leading-[0.95] tracking-tight md:text-6xl"
            style={{ color: M90_NAVY }}
          >
            Jerseys que
            <br />
            <span style={{ color: "#980e21" }}>cuentan historias</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[#011b53]/75 md:text-base">
            Pídelos por WhatsApp y los enviamos a toda Cuba — La Habana, Matanzas,
            Pinar del Río, Mayabeque y Artemisa. Pago Transfermóvil, Zelle, PayPal
            o efectivo a la entrega.
          </p>
        </div>
      </section>

      <TiendaCatalog products={products} />

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-5 pb-10 text-center md:px-8">
        <p className="text-xs text-[#011b53]/55">
          © 2026 M90 Sports · Tienda online de jerseys deportivos en Cuba
        </p>
      </footer>
    </main>
  )
}
