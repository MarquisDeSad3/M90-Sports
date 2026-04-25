import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"
import sharp from "sharp"
import { requireAdminRole } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Where uploaded files land on disk. In production this is a mounted volume
 * configured through Coolify so files survive container redeploys; in dev
 * it falls back to a path under the working directory.
 */
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads")
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Bandwidth in Cuba is expensive and slow, so we never persist a 4MB phone
 * photo as-is. Every accepted image is run through sharp:
 *   - Downscale to fit within 1600x1600 (preserve aspect ratio, no enlarge).
 *   - Strip metadata (EXIF, GPS, color profile bloat).
 *   - Encode as WebP at q82 — sharp's sweet spot for photo-like content,
 *     ~30% smaller than the equivalent JPEG with no visible loss.
 * Animated GIFs keep the GIF format because WebP's animated support is
 * patchy across browsers we care about.
 */
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 82

/**
 * Magic-byte signatures we accept. Browsers can spoof Content-Type, so we
 * sniff the real format from the file's first bytes.
 */
const SIGNATURES: Array<{
  ext: "jpg" | "png" | "webp" | "gif"
  mime: string
  test: (buf: Uint8Array) => boolean
}> = [
  {
    ext: "jpg",
    mime: "image/jpeg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "png",
    mime: "image/png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "webp",
    mime: "image/webp",
    test: (b) =>
      // RIFF....WEBP
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    ext: "gif",
    mime: "image/gif",
    test: (b) =>
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
]

function detect(buf: Uint8Array) {
  return SIGNATURES.find((s) => s.test(buf)) ?? null
}

export async function POST(request: Request) {
  // Auth: any logged-in admin can upload (used for products, profile photos,
  // category images). Tightening per-purpose can come later if needed.
  try {
    await requireAdminRole("staff")
  } catch (err) {
    const status = (err as Error)?.message === "FORBIDDEN" ? 403 : 401
    return NextResponse.json({ error: "No autorizado." }, { status })
  }

  // Pull the file out of the multipart form. We support a single field name
  // "file" — front-ends should iterate calls if uploading several.
  let file: File | null = null
  try {
    const form = await request.formData()
    const candidate = form.get("file")
    if (candidate instanceof File) file = candidate
  } catch {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json(
      { error: 'Falta el campo "file".' },
      { status: 400 },
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Archivo vacío." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Archivo demasiado grande (máx ${MAX_BYTES / 1024 / 1024} MB).` },
      { status: 413 },
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const sig = detect(bytes.slice(0, 16))
  if (!sig) {
    // Magic-byte check beats Content-Type — refuse if the bytes don't
    // match one of the formats we know how to serve.
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG, WebP o GIF." },
      { status: 400 },
    )
  }

  // Random filename — don't trust user-supplied names (path traversal,
  // collisions, leaking metadata). Animated GIFs keep their extension;
  // everything else gets re-encoded to WebP for size and uniformity.
  const id = randomBytes(16).toString("hex")
  let outputBytes: Uint8Array
  let outputExt: "webp" | "gif"
  let outputMime: string

  try {
    if (sig.ext === "gif") {
      // Pass through GIFs untouched — sharp can read animated GIFs but
      // re-encoding to animated WebP is browser-flaky. Resize via sharp
      // would freeze it to a single frame, which would break expectations.
      outputBytes = bytes
      outputExt = "gif"
      outputMime = "image/gif"
    } else {
      const processed = await sharp(bytes)
        .rotate() // honor EXIF orientation before we strip metadata
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
      outputBytes = new Uint8Array(processed)
      outputExt = "webp"
      outputMime = "image/webp"
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[upload] sharp failed:", msg)
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 400 },
    )
  }

  const fileName = `${id}.${outputExt}`

  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, fileName), outputBytes)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[upload] write failed:", msg)
    return NextResponse.json(
      { error: "No se pudo guardar el archivo." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    url: `/api/files/${fileName}`,
    name: fileName,
    size: outputBytes.byteLength,
    contentType: outputMime,
  })
}
