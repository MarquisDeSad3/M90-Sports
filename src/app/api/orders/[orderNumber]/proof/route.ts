import { NextResponse, type NextRequest } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"
import sharp from "sharp"
import { and, eq, isNull } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads")
const MAX_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 82

const ALLOWED_METHODS = ["transfermovil", "zelle", "paypal"] as const
type AllowedMethod = (typeof ALLOWED_METHODS)[number]

interface MagicByteCheck {
  ext: "jpg" | "png" | "webp"
  test: (buf: Uint8Array) => boolean
}

const SIGNATURES: MagicByteCheck[] = [
  {
    ext: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "png",
    test: (b) =>
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

function detect(prefix: Uint8Array): MagicByteCheck | null {
  return SIGNATURES.find((sig) => sig.test(prefix)) ?? null
}

// Tiny in-memory rate limiter — per-IP cap to deter spam. The endpoint
// is unauthenticated so this matters; for multi-instance prod we'd swap
// to Redis but this single-container deploy is fine with a Map.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params
  if (!orderNumber || orderNumber.length < 4 || orderNumber.length > 40) {
    return NextResponse.json(
      { error: "Pedido inválido." },
      { status: 400 },
    )
  }

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto." },
      { status: 429 },
    )
  }

  // Find the order. Must exist, not deleted, not already paid/cancelled.
  const orderRows = await db
    .select()
    .from(orders)
    .where(
      and(
        isNull(orders.deletedAt),
        eq(orders.orderNumber, orderNumber),
      ),
    )
    .limit(1)
  const order = orderRows[0]
  if (!order) {
    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 },
    )
  }
  if (order.status === "cancelled") {
    return NextResponse.json(
      { error: "Este pedido fue cancelado." },
      { status: 409 },
    )
  }
  if (order.paymentStatus === "verified") {
    return NextResponse.json(
      { error: "Este pedido ya está pagado." },
      { status: 409 },
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const methodRaw = String(formData.get("method") ?? "")
  const transactionRef = String(formData.get("transactionRef") ?? "").trim()

  if (!file) {
    return NextResponse.json(
      { error: 'Falta el comprobante (campo "file").' },
      { status: 400 },
    )
  }

  const method = ALLOWED_METHODS.includes(methodRaw as AllowedMethod)
    ? (methodRaw as AllowedMethod)
    : ((order.paymentMethod as AllowedMethod | null) ?? null)
  if (!method) {
    return NextResponse.json(
      { error: "Método de pago inválido." },
      { status: 400 },
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Archivo vacío." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Archivo demasiado grande (máx ${MAX_BYTES / 1024 / 1024} MB).`,
      },
      { status: 413 },
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!detect(bytes.slice(0, 16))) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WebP." },
      { status: 400 },
    )
  }

  let outputBytes: Uint8Array
  try {
    const processed = await sharp(bytes)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    outputBytes = new Uint8Array(processed)
  } catch (err) {
    console.error("[proof-upload] sharp:", err)
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 400 },
    )
  }

  const fileId = randomBytes(16).toString("hex")
  const fileName = `proof_${fileId}.webp`
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, fileName), outputBytes)
  } catch (err) {
    console.error("[proof-upload] write:", err)
    return NextResponse.json(
      { error: "No se pudo guardar el archivo." },
      { status: 500 },
    )
  }

  const proofUrl = `/api/files/${fileName}`
  const now = new Date()

  try {
    await db.insert(payments).values({
      id: `pay_${createId()}`,
      orderId: order.id,
      method,
      amount: order.depositAmount ?? order.total,
      currency: order.currency,
      proofUrl,
      proofUploadedAt: now,
      transactionRef: transactionRef || null,
      status: "proof_uploaded",
    })

    await db
      .update(orders)
      .set({
        paymentStatus: "proof_uploaded",
        paymentMethod: method,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id))
  } catch (err) {
    console.error("[proof-upload] db:", err)
    return NextResponse.json(
      { error: "No se pudo registrar el comprobante." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    redirect: `/pedido/${orderNumber}`,
  })
}
