import type { MetadataRoute } from "next"
import { and, asc, desc, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // 1h — Google won't hit this often anyway

const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: "daily" | "weekly" | "monthly"
}> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/por-encargo", priority: 0.7, changeFrequency: "weekly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Published products only — drafts/archived stay out of the index.
  // Cap at 5000 so the sitemap stays under Google's 50k entry limit
  // even if the catalog grows. We'll split into multiple sitemaps when
  // we cross that line.
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const rows = await db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(
        and(
          isNull(products.deletedAt),
          eq(products.status, "published"),
        ),
      )
      .orderBy(desc(products.featured), asc(products.sortOrder))
      .limit(5000)

    productEntries = rows.map((p) => ({
      url: `${SITE_URL}/tienda/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sitemap] DB unavailable in dev:", err)
    }
  }

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...productEntries,
  ]
}
