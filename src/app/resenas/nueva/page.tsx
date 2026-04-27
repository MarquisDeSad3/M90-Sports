import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import { ReviewForm } from "./review-form"
import { getPublicProducts } from "@/lib/queries/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Deja tu reseña",
  description:
    "Cuéntanos cómo te llegó tu pedido M90 Sports. Tu reseña nos ayuda a otros clientes a comprar con confianza.",
  robots: { index: false, follow: false },
}

const M90_NAVY = "#011b53"

interface PageProps {
  searchParams: Promise<{ producto?: string; pedido?: string }>
}

export default async function NuevaResenaPage({ searchParams }: PageProps) {
  const { producto, pedido } = await searchParams

  // Slim list of selectable products. Published catalog stays small —
  // ~50 items today — so we ship them all and let the client filter.
  const allProducts = await getPublicProducts()
  const choices = allProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    team: p.team,
  }))

  const initialProduct =
    producto && choices.some((c) => c.slug === producto) ? producto : null

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      <section className="mx-auto max-w-2xl px-5 pt-28 pb-10 md:px-8 md:pt-32">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/65 hover:text-[#011b53]"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio
        </Link>

        <header className="mt-4 flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#980e21]">
            Reseñas
          </span>
          <h1
            className="font-display text-3xl leading-tight tracking-tight md:text-4xl"
            style={{ color: M90_NAVY }}
          >
            Deja tu reseña
          </h1>
          <p className="max-w-xl text-sm text-[#011b53]/75">
            Cuéntanos cómo te llegó tu pedido. La revisamos y, si encaja,
            la publicamos en el producto en menos de 48h.
          </p>
        </header>

        <ReviewForm
          products={choices}
          initialProductSlug={initialProduct}
          initialOrderNumber={pedido ?? null}
        />
      </section>

      <WhatsappFloat />
    </main>
  )
}
