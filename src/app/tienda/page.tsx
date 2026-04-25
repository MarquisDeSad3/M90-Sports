import type { Metadata } from "next"
import { Package, Search } from "lucide-react"
import { Nav } from "@/components/nav"
import { ProductTile } from "@/components/public/product-tile"
import { getPublicProducts } from "@/lib/queries/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Tienda · M90 Sports",
  description:
    "Jerseys NBA, fútbol y retro entregados en Cuba. Pago por Transfermóvil, Zelle o efectivo a la entrega.",
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

      {/* Catalog */}
      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(1,27,83,0.15)] bg-white/50 px-6 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-[rgba(1,27,83,0.08)]">
              <Package className="size-5 text-[#011b53]/60" />
            </div>
            <h2 className="text-lg font-semibold text-[#011b53]">
              Catálogo en preparación
            </h2>
            <p className="max-w-sm text-sm text-[#011b53]/65">
              Estamos trayendo los jerseys ahora mismo. Vuelve pronto o
              escríbenos por WhatsApp para pedir uno específico.
            </p>
            <a
              href="https://wa.me/5351191461?text=Hola%20M90%2C%20quiero%20saber%20cuándo%20añaden%20más%20productos"
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-xs font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
            >
              <Search className="size-3.5" />
              Pídelo por WhatsApp
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#011b53]/60">
                {products.length} {products.length === 1 ? "producto" : "productos"}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {products.map((p) => (
                <ProductTile key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-5 pb-10 text-center md:px-8">
        <p className="text-xs text-[#011b53]/55">
          © 2026 M90 Sports · Tienda online de jerseys deportivos en Cuba
        </p>
      </footer>
    </main>
  )
}
