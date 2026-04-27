import { NextResponse, type NextRequest } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { customers, orders, products, reviews } from "@/lib/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Tiny in-memory rate limit — per-IP, per minute. Endpoint is public so
// we don't want a single bot to stuff the queue.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 3
const ipBuckets = new Map<string, { count: number; firstSeenAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = ipBuckets.get(ip)
  if (!bucket || now - bucket.firstSeenAt > RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, firstSeenAt: now })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

const reviewSchema = z
  .object({
    // Optional: empty string or missing → general M90 review (no
    // product link). When present, must match an existing product.
    productSlug: z
      .string()
      .trim()
      .max(120)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    // Half-star ratings 1, 1.5, 2, ... 5. Must round to a 0.5 step.
    rating: z.coerce
      .number()
      .min(0.5)
      .max(5)
      .refine((n) => Math.abs(n * 2 - Math.round(n * 2)) < 0.001, {
        message: "Puntuación inválida",
      }),
    customerName: z.string().trim().min(2).max(60),
    title: z
      .string()
      .trim()
      .max(80)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    body: z.string().trim().min(10).max(1500),
    orderNumber: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    _hp: z.string().max(0).optional().or(z.literal("")),
  })
  .strict()

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas reseñas en poco tiempo. Espera un momento." },
      { status: 429 },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 },
    )
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Datos inválidos.",
      },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Optional product link. If the customer didn't pick one, the review
  // is a "general M90" review and goes into the unlinked pool.
  let productId: string | null = null
  if (data.productSlug) {
    const productRows = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(isNull(products.deletedAt), eq(products.slug, data.productSlug)),
      )
      .limit(1)
    const product = productRows[0]
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 },
      )
    }
    productId = product.id
  }

  // Optional: tie back to the order + customer if the number is valid.
  // Failing the lookup doesn't fail the review — Ever sees the unverified
  // tag in admin and can act on it.
  let orderId: string | null = null
  let customerId: string | null = null
  if (data.orderNumber) {
    const orderRows = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(
        and(
          isNull(orders.deletedAt),
          eq(orders.orderNumber, data.orderNumber),
        ),
      )
      .limit(1)
    const order = orderRows[0]
    if (order) {
      orderId = order.id
      customerId = order.customerId ?? null
    }
  }

  // Customer fallback: try matching by name only if we didn't get one
  // from the order. We don't auto-create — admin can link manually.
  if (!customerId) {
    const customerRows = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.name, data.customerName))
      .limit(1)
    customerId = customerRows[0]?.id ?? null
  }

  try {
    await db.insert(reviews).values({
      id: `rev_${createId()}`,
      productId,
      orderId,
      customerId,
      customerName: data.customerName,
      rating: String(data.rating),
      title: data.title ?? null,
      body: data.body,
      photoUrl: null,
      status: "pending",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[reviews] insert failed:", msg)
    return NextResponse.json(
      { error: "No se pudo guardar la reseña." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
