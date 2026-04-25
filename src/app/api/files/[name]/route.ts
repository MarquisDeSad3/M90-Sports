import { NextResponse } from "next/server"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads")

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

/**
 * Public file server for uploaded images. Reads from the same directory the
 * upload endpoint writes to, with a couple of safety rails against the
 * obvious abuse paths.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params

  // Reject anything that could escape the upload dir or pull a hidden file.
  // Filenames we generate match this shape; anything else is a probe attempt.
  if (!/^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/i.test(name)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const filePath = path.join(UPLOAD_DIR, name)
  let content: Buffer
  let size: number
  try {
    const s = await stat(filePath)
    if (!s.isFile()) {
      return new NextResponse("Not found", { status: 404 })
    }
    size = s.size
    content = await readFile(filePath)
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }

  const ext = name.split(".").pop()!.toLowerCase()
  const contentType = MIME[ext] ?? "application/octet-stream"

  return new NextResponse(content as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      // Long cache — file IDs are random, so a "new" upload always has a
      // new URL and stale caches don't matter.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
