import { SmoothScroll } from "@/components/smooth-scroll";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Categories } from "@/components/categories";
import { Catalog } from "@/components/catalog";
import { HowToBuy } from "@/components/how-to-buy";
import { Shipping } from "@/components/shipping";
import { Testimonials } from "@/components/testimonials";
import { Faq } from "@/components/faq";
import { FooterCta } from "@/components/footer-cta";
import { WhatsappFloat } from "@/components/whatsapp-float";
import { JoinPopup } from "@/components/join-popup";
import { Preloader } from "@/components/preloader";
import { CartProvider } from "@/lib/cart-store";
import { CartDrawer } from "@/components/cart-drawer";

export default function Home() {
  return (
    <CartProvider>
      <Preloader />
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Categories />
        <Catalog />
        <HowToBuy />
        <Shipping />
        <Testimonials />
        <Faq />
      </main>
      <FooterCta />
      <WhatsappFloat />
      <JoinPopup />
      <CartDrawer />
    </CartProvider>
  );
}
