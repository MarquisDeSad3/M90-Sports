import Link from "next/link"
import { ProductImage } from "@/components/admin/product-image"
import type { PublicProduct } from "@/lib/queries/public-products"

export function ProductTile({ product }: { product: PublicProduct }) {
  const outOfStock = product.totalStock === 0 && !product.isPreorder

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group flex flex-col gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-[rgba(1,27,83,0.08)] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[rgba(1,27,83,0.12)]"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[rgba(1,27,83,0.04)]">
        {product.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <ProductImage
            team={product.team ?? "M90"}
            number={product.number ?? undefined}
            size="lg"
            className="size-32 md:size-40"
          />
        )}

        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Agotado
          </span>
        )}
        {product.isPreorder && (
          <span className="absolute left-2 top-2 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Pre-orden
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1 pb-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-[#011b53] group-hover:text-[#980e21]">
          {product.name}
        </h3>
        {(product.team || product.season) && (
          <p className="text-xs text-[#011b53]/60">
            {[product.team, product.season].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-xl tabular-nums text-[#011b53]">
            ${product.basePrice.toFixed(0)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-[#011b53]/50 line-through tabular-nums">
              ${product.compareAtPrice.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
