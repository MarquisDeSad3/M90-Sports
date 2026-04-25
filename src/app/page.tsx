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
    "Camisetas oficiales, retro y selecciones. Envíos a toda Cuba. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.",
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ])

  return (
    <>
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
