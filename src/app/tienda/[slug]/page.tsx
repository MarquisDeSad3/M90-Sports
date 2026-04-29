import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, Sparkles, Truck } from "lucide-react"
import { Nav } from "@/components/nav"
import { ProductImage } from "@/components/admin/product-image"
import { AddToCartForm } from "@/components/public/add-to-cart-form"
import {
  ProductReviews,
  RatingPill,
} from "@/components/public/product-reviews"
import { getPublicProduct } from "@/lib/queries/public-products"
import {
  getApprovedReviews,
  getProductRatingSummary,
} from "@/lib/queries/public-reviews"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) {
    return { title: "Producto no encontrado · M90", robots: { index: false } }
  }

  // Description that reads like a sentence Google can use as a snippet,
  // not a marketing slogan. Strip user-entered HTML defensively.
  const desc = product.description
    ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Camiseta ${product.name}. Envíos a las 16 provincias de Cuba con seguimiento. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.`

  const url = `${SITE_URL}/tienda/${product.slug}`
  const image = product.primaryImageUrl
    ? product.primaryImageUrl.startsWith("http")
      ? product.primaryImageUrl
      : `${SITE_URL}${product.primaryImageUrl}`
    : `${SITE_URL}/brand/m90-red.png`

  return {
    title: `${product.name} · M90 Sports`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description: desc,
      url,
      type: "website",
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: desc,
      images: [image],
    },
  }
}

const M90_NAVY = "#011b53"

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) notFound()

  const [reviews, ratingSummary] = await Promise.all([
    getApprovedReviews(product.id),
    getProductRatingSummary(product.id),
  ])

  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
  const availability =
    totalStock > 0 || product.isPreorder
      ? product.isPreorder
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock"
      : "https://schema.org/OutOfStock"

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description?.replace(/<[^>]*>/g, "") ??
      `Camiseta ${product.name} — M90 Sports`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.team || "M90 Sports",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/tienda/${product.slug}`,
      priceCurrency: "USD",
      price: product.basePrice.toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "M90 Sports" },
    },
  }
  if (product.primaryImageUrl) {
    productLd.image = product.primaryImageUrl.startsWith("http")
      ? product.primaryImageUrl
      : `${SITE_URL}${product.primaryImageUrl}`
  }
  if (ratingSummary.reviewCount > 0) {
    // Google rich results show stars under the product link in search
    // when AggregateRating is present.
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingSummary.averageRating.toFixed(1),
      reviewCount: ratingSummary.reviewCount,
      bestRating: "5",
      worstRating: "1",
    }
  }

  return (
    <main className="relative min-h-svh bg-[#f7ebc8]" style={{ color: M90_NAVY }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Nav />

      <div className="mx-auto max-w-6xl px-5 pt-28 pb-2 md:px-8 md:pt-32">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#011b53]/75 transition-colors hover:text-[#011b53]"
        >
          <ArrowLeft className="size-4" />
          Volver a la tienda
        </Link>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 pb-20 md:grid-cols-2 md:gap-10 md:px-8">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/80 ring-1 ring-[rgba(1,27,83,0.08)]">
          {product.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ProductImage
                team={product.team ?? "M90"}
                number={product.number ?? undefined}
                size="lg"
                className="size-48 md:size-64"
              />
            </div>
          )}

          {product.isPreorder && (
            <span className="absolute left-3 top-3 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Pre-orden
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {(product.team || product.season) && (
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/55">
                {[product.team, product.season].filter(Boolean).join(" · ")}
              </span>
            )}
            <h1
              className="font-display text-3xl leading-tight tracking-tight md:text-5xl"
              style={{ color: M90_NAVY }}
            >
              {product.name}
            </h1>
            {product.player && product.number && (
              <p className="text-sm text-[#011b53]/70">
                #{product.number} · {product.player}
              </p>
            )}
          </div>

          {/* Price + rating */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span
                className="font-display text-4xl tabular-nums md:text-5xl"
                style={{ color: M90_NAVY }}
              >
                ${product.basePrice.toFixed(0)}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-[#011b53]/50 line-through tabular-nums">
                  ${product.compareAtPrice.toFixed(0)}
                </span>
              )}
            </div>
            <RatingPill summary={ratingSummary} size="sm" />
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-[#011b53]/80 md:text-base">
              {product.description}
            </p>
          )}

          {/* Add to cart form (Client Component) */}
          <AddToCartForm
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              team: product.team ?? "",
              number: product.number ?? undefined,
              basePrice: product.basePrice,
              primaryImageUrl: product.primaryImageUrl,
              variants: product.variants,
              isPreorder: product.isPreorder,
            }}
          />

          {/* Trust signals */}
          <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-[rgba(1,27,83,0.08)] bg-white/60 p-4">
            <div className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#011b53]/70" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  Calidad 1:1 garantizada
                </span>
                <span className="text-xs text-[#011b53]/65">
                  Camisetas en versiones fan y jugador, calidad 1:1. El resto
                  de los artículos son originales.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 size-4 shrink-0 text-[#011b53]/70" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  Envíos a las 16 provincias de Cuba
                </span>
                <span className="text-xs text-[#011b53]/65">
                  Mensajería con seguimiento. Tarifa y tiempo se confirman por
                  WhatsApp antes del pago.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#011b53]/70" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  Pedido por WhatsApp
                </span>
                <span className="text-xs text-[#011b53]/65">
                  Tu carrito se manda directo al chat — Ever te confirma todo personalmente
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews — renders the section if there are reviews; either way
          we surface a "Deja tu reseña" CTA so the customer can write one. */}
      <div className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <ProductReviews reviews={reviews} summary={ratingSummary} />
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-white/85 p-6 ring-1 ring-[rgba(1,27,83,0.08)] md:flex-row md:justify-between">
          <div className="flex flex-col gap-0.5 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
              ¿Compraste esta camiseta?
            </span>
            <span className="text-sm text-[#011b53]/80">
              Cuéntale al resto cómo te llegó. Tu reseña ayuda a otros a comprar
              con confianza.
            </span>
          </div>
          <Link
            href={`/resenas/nueva?producto=${encodeURIComponent(product.slug)}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#011b53] px-5 py-2.5 text-xs font-semibold text-[#efd9a3] transition-transform hover:-translate-y-0.5"
          >
            Escribir reseña
          </Link>
        </div>
      </div>
    </main>
  )
}
