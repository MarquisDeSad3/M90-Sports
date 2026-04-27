import type { MetadataRoute } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin tooling, raw API endpoints and customer-specific pages
        // never need to be crawled.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/checkout",
          "/carrito",
          "/pedido/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
