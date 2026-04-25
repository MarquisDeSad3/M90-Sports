import type { Metadata } from "next"
import { StorefrontHeader } from "@/components/public/storefront-header"
import { HomeClient } from "@/components/public/home-client"
import { getPublicProducts } from "@/lib/queries/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "M90 Sports — Jerseys de fútbol y NBA en Cuba",
  description:
    "Camisetas oficiales, retro y selecciones. Envíos a toda Cuba. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.",
}

export default async function HomePage() {
  const products = await getPublicProducts()

  return (
    <main className="relative min-h-svh bg-[#f7ebc8] text-[#011b53]">
      {/* Subtle backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <StorefrontHeader />
      <HomeClient products={products} />

      {/* Footer */}
      <footer className="border-t border-[rgba(1,27,83,0.1)] bg-[#f1e7c5]/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-1">
            <span className="font-display text-lg text-[#011b53]">M90 Sports</span>
            <span className="text-xs text-[#011b53]/60">
              Tienda de jerseys deportivos en Cuba — © 2026
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://wa.me/5351191461"
              target="_blank"
              rel="noopener"
              className="font-semibold text-[#011b53] hover:text-[#980e21]"
            >
              WhatsApp
            </a>
            <span className="text-[#011b53]/30">·</span>
            <a
              href="/reviews"
              className="font-semibold text-[#011b53] hover:text-[#980e21]"
            >
              Reseñas
            </a>
            <span className="text-[#011b53]/30">·</span>
            <a
              href="/admin/login"
              className="text-[#011b53]/40 hover:text-[#011b53]"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
