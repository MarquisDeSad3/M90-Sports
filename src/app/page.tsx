import type { Metadata } from "next"
import { Hero } from "@/components/hero"
import { Categories } from "@/components/categories"
import { HowToBuy } from "@/components/how-to-buy"
import { Shipping } from "@/components/shipping"
import { Testimonials } from "@/components/testimonials"
import { Faq } from "@/components/faq"
import { FooterCta } from "@/components/footer-cta"
import { WhatsappFloat } from "@/components/whatsapp-float"
import { Nav } from "@/components/nav"
import { StoreSection } from "@/components/public/store-section"
import {
  getPublicCategories,
  getPublicProducts,
} from "@/lib/queries/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "M90 Sports — Jerseys de fútbol y NBA en Cuba",
  description:
    "Camisetas oficiales, retro y selecciones. Envíos a toda Cuba. Pago por Zelle, PayPal o efectivo a la entrega.",
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

const orgLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "M90 Sports",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/m90-red.png`,
  description:
    "Tienda de jerseys deportivos en Cuba. Camisetas oficiales, retro, selecciones y NBA.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "CU",
    addressRegion: "La Habana",
  },
  areaServed: { "@type": "Country", name: "Cuba" },
  paymentAccepted: ["Zelle", "PayPal", "Cash"],
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/tienda?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <Nav />
      <main>
        <Hero />
        <Categories />
        <StoreSection products={products} categories={categories} />
        <HowToBuy />
        <Shipping />
        <Testimonials />
        <Faq />
      </main>
      <FooterCta />
      <WhatsappFloat />
    </>
  )
}
