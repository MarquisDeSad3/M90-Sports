import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Truck } from "lucide-react"
import { StorefrontHeader } from "@/components/public/storefront-header"
import { ProductImage } from "@/components/admin/product-image"
import { AddToCartForm } from "@/components/public/add-to-cart-form"
import { getPublicProduct } from "@/lib/queries/public-products"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) return { title: "Producto no encontrado · M90" }
  return {
    title: `${product.name} · M90 Sports`,
    description:
      product.description ?? `${product.name} — Jerseys M90 Sports`,
  }
}

const M90_NAVY = "#011b53"

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getPublicProduct(slug)
  if (!product) notFound()

  return (
    <main className="relative min-h-svh bg-[#f7ebc8]" style={{ color: M90_NAVY }}>
      <StorefrontHeader />

      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-10">
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

          {/* Price */}
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
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[rgba(1,27,83,0.08)] bg-white/60 p-4">
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 size-4 shrink-0 text-[#011b53]/70" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  Envío a toda Cuba occidental
                </span>
                <span className="text-xs text-[#011b53]/65">
                  La Habana, Matanzas, Pinar del Río, Mayabeque y Artemisa
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
    </main>
  )
}
