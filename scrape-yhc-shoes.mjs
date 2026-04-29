/**
 * yhc956848708 → m90 shoe importer.
 *
 * The wsp007 jersey scraper (scrape-yupoo.mjs) iterates a paginated
 * /albums?tab=gallery listing and classifies titles into kept buckets.
 * This source is structured differently:
 *
 *   /categories                           → list of /categories/<cid> links
 *   /categories/<cid>                     → list of /albums/<aid>?... links
 *   /albums/<aid>?uid=...&referrercate=…  → photo CDN URLs
 *
 * Every album here is a football boot SKU, so we skip the
 * famous/non-famous classifier and keep everything (except Chinese-only
 * titles, which we still skip — Ever wants Spanish/English copy).
 *
 * Imports land as `prod_yhc_<sha>` (different prefix from prod_yp_ so
 * the two sources stay separable) and are auto-tagged into the
 * `cat_enc_zapatos` category.
 */

import { Client } from "pg"
import { createHash, randomBytes } from "node:crypto"
import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const BASE = "https://yhc956848708.x.yupoo.com"
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/m90-uploads"
const MAX_PHOTOS = Number(process.env.MAX_PHOTOS || 6)
const SLEEP_MS = Number(process.env.SLEEP_MS || 100)
const PHOTO_CONCURRENCY = Number(process.env.PHOTO_CONCURRENCY || 6)
const DEFAULT_PRICE = "0"
const ZAPATOS_CATEGORY_ID = "cat_enc_zapatos"

const SKIP_TITLE_PATTERNS = [
  /question/i,
  /shipping/i,
  /\bhow to\b/i,
  /size (information|chart)/i,
  /service center/i,
]

/**
 * Chinese-term → Spanish/English translations for category names.
 * Most categories are model-line + tech + surface, e.g.
 *   "刺客17梭织SG"  → "X 17 Woven SG"
 *   "猎鹰26.1 SG"    → "Predator 26.1 SG"
 *   "GX3低帮针织SG" → "GX3 Low-Top Knit SG"
 *
 * Order matters: longer/more specific phrases must come BEFORE shorter
 * substrings so we don't half-translate ("低帮" before "帮").
 */
const TRANSLATIONS = [
  // Model lines
  ["刺客", "X"],
  ["鬼牌", "Phantom"],
  ["猎鹰", "Predator"],
  // Tech / construction
  ["低帮针织", "Low-Top Knit"],
  ["高帮针织", "High-Top Knit"],
  ["低帮", "Low-Top"],
  ["高帮", "High-Top"],
  ["针织", "Knit"],
  ["梭织", "Woven"],
  ["网格MD", "Mesh MD"],
  ["网布", "Mesh"],
  ["网格", "Grid"],
  ["太空", "Space"],
  ["平底", "Flat"],
  ["气垫", "Air"],
  ["盖帽", "Top"],
  ["次顶级", "Pro"],
  ["顶级", "Premium"],
  ["普通", "Std"],
  ["无鞋带", "Laceless"],
  // Product types
  ["拖鞋", "Slippers"],
  ["橄榄球鞋", "Rugby Boots"],
  // Misc filler — drop entirely
  ["实拍", ""],
  ["足球地带", ""],
]

function translateName(s) {
  let out = s
  // Pad each replacement with spaces so adjacent terms don't glue
  // ("刺客17梭织SG" → "X 17 Woven SG", not "X17WovenSG"). The final
  // whitespace-collapse pass cleans up the redundant ones.
  for (const [zh, es] of TRANSLATIONS) {
    out = out.split(zh).join(` ${es} `)
  }
  // Also insert a space between a digit and a Latin letter so "Puma8SG"
  // becomes "Puma 8 SG" — the source mashes them together a lot.
  out = out.replace(/(\d)([A-Za-z])/g, "$1 $2")
  out = out.replace(/([A-Za-z])(\d)/g, "$1 $2")
  // Collapse whitespace + trim leading/trailing separators.
  out = out
    .replace(/\s+/g, " ")
    .replace(/^[-·\s]+|[-·\s]+$/g, "")
    .trim()
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

function detectExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg"
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png"
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "gif"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "webp"
  return null
}

async function downloadPhoto(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: `${BASE}/`,
    },
  })
  if (!res.ok) throw new Error(`download ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ext = detectExt(buf)
  if (!ext) throw new Error(`unknown format ${url}`)
  const name = `${randomBytes(16).toString("hex")}.${ext}`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, name), buf)
  return { url: `/api/files/${name}`, bytes: buf.length }
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
}

/** From /categories → array of { cid, name }. */
function parseCategoriesPage(html) {
  const re =
    /<a[^>]*href="\/categories\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi
  const out = []
  const seen = new Set()
  let m
  while ((m = re.exec(html))) {
    const cid = m[1]
    if (seen.has(cid)) continue
    seen.add(cid)
    const name = decodeHtml(
      m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    ).slice(0, 120)
    if (name) out.push({ cid, name })
  }
  return out
}

/**
 * /categories/<cid> → array of { yupooId, title, href, coverUrl }.
 *
 * Mirrors the wsp007 listing parser but the markup nests the title
 * inside a separate <span class="album__title"> rather than the <a>'s
 * `title` attr — so we capture both forms for resilience.
 */
function parseCategoryListing(html) {
  const out = []
  const seen = new Set()

  // Pattern A: <a class="album__main" title="..." href="/albums/N?...">
  //              ... <img src="...photo.yupoo.com..." />
  const reA =
    /class="album__main"\s+title="([^"]+)"\s+href="(\/albums\/(\d+)[^"]*)"[^]*?<img[^>]+(?:data-src|src)="(https?:\/\/[^"]+)"/g
  let m
  while ((m = reA.exec(html))) {
    if (seen.has(m[3])) continue
    seen.add(m[3])
    out.push({
      yupooId: m[3],
      title: decodeHtml(m[1]),
      href: decodeHtml(m[2]),
      coverUrl: m[4].replace(/^\/\//, "https://"),
    })
  }

  // Pattern B (older markup): plain <a href="/albums/N?…"> with the
  // title rendered later as <h3 class="album__title">.
  const reB = /<a[^>]+href="(\/albums\/(\d+)[^"]*)"[^>]*>/g
  while ((m = reB.exec(html))) {
    if (seen.has(m[2])) continue
    seen.add(m[2])
    // Find the title for this album in the nearby span/h3.
    const after = html.slice(m.index, m.index + 1500)
    const titleMatch = after.match(
      /class="(?:album__title|title|albumWaterfall__title)"[^>]*>([^<]+)</i,
    )
    const imgMatch = after.match(
      /(?:data-src|src)="(https?:\/\/[^"]+photo\.yupoo\.com[^"]+)"/,
    )
    if (!titleMatch || !imgMatch) continue
    out.push({
      yupooId: m[2],
      title: decodeHtml(titleMatch[1]).trim(),
      href: decodeHtml(m[1]),
      coverUrl: imgMatch[1].replace(/^\/\//, "https://"),
    })
  }

  return out
}

function parseAlbum(html) {
  const urls = new Set()
  const reA = /(?:data-origin-src|data-src|src)="(https?:\/\/photo\.yupoo\.com\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi
  let m
  while ((m = reA.exec(html))) {
    let url = m[1]
    if (url.startsWith("//")) url = `https:${url}`
    // Skip thumbnail icons + tiny variants.
    if (/icons\/logo/.test(url)) continue
    if (/\/small\.|\/thumb\./.test(url)) continue
    urls.add(url)
  }
  return [...urls]
}

function shouldSkipInfoPage(title) {
  return SKIP_TITLE_PATTERNS.some((re) => re.test(title))
}

function isMostlyChinese(title) {
  // Strip ASCII + punctuation; if what remains is mostly CJK, skip.
  const stripped = title.replace(/[\sA-Za-z0-9._\-+/(){}#"'!&]/g, "")
  return stripped.length > Math.max(2, Math.floor(title.length * 0.4))
}

function productIdFor(yupooId) {
  const h = createHash("sha256")
    .update(`yhc:${yupooId}`)
    .digest("hex")
    .slice(0, 24)
  return `prod_yhc_${h}`
}

async function alreadyImported(client, productId) {
  const r = await client.query(
    "SELECT 1 FROM products WHERE id = $1 LIMIT 1",
    [productId],
  )
  return r.rowCount > 0
}

async function insertProduct(client, { id, slug, name, yupooId }) {
  // This source ships many albums with the SAME title ("39-45 SG"),
  // so a plain slugify() collides constantly. Always suffix with the
  // yupoo album id — guarantees uniqueness without the try/retry
  // dance that would otherwise abort the surrounding transaction.
  const finalSlug = `${slug || "zapato"}-${yupooId.slice(-6)}`
  const description = `[Importado de Yupoo · album ${yupooId} · zapatos]`
  await client.query(
    `INSERT INTO products
     (id, slug, name, description, status, base_price, featured,
      is_preorder, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'draft', $5, false, true, 0, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [id, finalSlug, name, description, DEFAULT_PRICE],
  )
}

async function insertImage(client, { productId, url, isPrimary, position }) {
  await client.query(
    `INSERT INTO product_images (id, product_id, url, alt, position, is_primary, created_at)
     VALUES ($1, $2, $3, NULL, $4, $5, NOW())`,
    [`img_yhc_${randomBytes(8).toString("hex")}`, productId, url, position, isPrimary],
  )
}

async function insertShoeVariants(client, productId) {
  // Football boot sizing — EU sizes are the de-facto standard the
  // supplier lists. Customers tell us their EU size. We seed 39-46.
  const sizes = [
    "EU_39",
    "EU_40",
    "EU_41",
    "EU_42",
    "EU_43",
    "EU_44",
    "EU_45",
    "EU_46",
  ]
  // The size enum doesn't have EU sizes — fall back to S-XXL until we
  // add a separate shoe-size enum. For now we map to slot variants the
  // existing enum supports; admin can tweak per product.
  const stub = ["S", "M", "L", "XL", "XXL"]
  for (let i = 0; i < stub.length; i++) {
    const variantId = `var_yhc_${randomBytes(8).toString("hex")}`
    const sku = `YHC-${productId.slice(-6)}-${stub[i]}`
    await client.query(
      `INSERT INTO variants (id, product_id, sku, size, stock, low_stock_alert, allow_backorder, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 999, 3, true, $5, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [variantId, productId, sku, stub[i], i],
    )
  }
  void sizes
}

async function tagAsZapatos(client, productId) {
  await client.query(
    `INSERT INTO product_categories (product_id, category_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [productId, ZAPATOS_CATEGORY_ID],
  )
}

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://m90:6qg9dq9nn63Swjnkd6J5kVnAIy617dFHudoYU0Q7rdWtUutd2UtUU0V0KqUgWvsp@localhost:5432/m90_sports",
  })
  await client.connect()

  console.log(`=== Fetching /categories from ${BASE} ===`)
  const rootHtml = await fetchHtml(`${BASE}/categories`)
  const categories = parseCategoriesPage(rootHtml)
  console.log(`Found ${categories.length} categories`)

  let totalSeen = 0
  let imported = 0
  let already = 0
  let chineseSkipped = 0
  let infoSkipped = 0
  let failed = 0

  for (const cat of categories) {
    const translatedCatName = translateName(cat.name)
    if (!translatedCatName) {
      console.log(`\n=== [${cat.cid}] ${cat.name} → SKIP (untranslatable) ===`)
      continue
    }
    console.log(`\n=== [${cat.cid}] ${cat.name} → ${translatedCatName} ===`)
    let html
    try {
      await sleep(SLEEP_MS)
      html = await fetchHtml(`${BASE}/categories/${cat.cid}`)
    } catch (e) {
      console.warn(`  category fetch failed: ${e.message}`)
      continue
    }
    const tiles = parseCategoryListing(html)
    console.log(`  ${tiles.length} albums`)

    let albumIdx = 0
    for (const tile of tiles) {
      totalSeen++
      if (shouldSkipInfoPage(tile.title)) {
        infoSkipped++
        continue
      }

      // Use the CATEGORY name as the product name (this is the model
      // line + construction + surface). The album title is just the
      // size range ("39-45 SG"), which is useless on its own. When a
      // category has multiple albums (different colorways), we
      // disambiguate with " · v2", " · v3" etc.
      albumIdx += 1
      const productName =
        albumIdx > 1
          ? `${translatedCatName} · v${albumIdx}`
          : translatedCatName

      const productId = productIdFor(tile.yupooId)
      if (await alreadyImported(client, productId)) {
        already++
        await tagAsZapatos(client, productId).catch(() => {})
        continue
      }

      console.log(`  → "${productName}"`)
      let albumHtml
      try {
        await sleep(SLEEP_MS)
        albumHtml = await fetchHtml(`${BASE}${tile.href}`)
      } catch (e) {
        console.warn(`    detail fetch failed: ${e.message}`)
        failed++
        continue
      }
      let photos = parseAlbum(albumHtml)
      photos = [tile.coverUrl, ...photos.filter((u) => u !== tile.coverUrl)]
      photos = photos.slice(0, MAX_PHOTOS)
      if (photos.length === 0) {
        console.warn(`    no photos`)
        failed++
        continue
      }

      try {
        await client.query("BEGIN")
        const slug = slugify(productName) || "zapato"
        await insertProduct(client, {
          id: productId,
          slug,
          name: productName,
          yupooId: tile.yupooId,
        })

        // Download all photos in parallel — yupoo's CDN handles
        // burst downloads fine and this is the single biggest speedup
        // (sequential 6× was ~720ms of unnecessary serialization).
        const downloads = await Promise.all(
          photos.slice(0, PHOTO_CONCURRENCY).map(async (url, i) => {
            try {
              const dl = await downloadPhoto(url)
              return { ok: true, dl, i }
            } catch (e) {
              return { ok: false, err: String(e?.message || e), i }
            }
          }),
        )
        let photosOk = 0
        for (const r of downloads) {
          if (!r.ok) {
            console.warn(`    photo ${r.i} failed: ${r.err}`)
            continue
          }
          await insertImage(client, {
            productId,
            url: r.dl.url,
            isPrimary: photosOk === 0,
            position: r.i,
          })
          photosOk++
        }

        if (photosOk === 0) {
          await client.query("ROLLBACK")
          console.warn(`    no photos downloaded — rolled back`)
          failed++
          continue
        }

        await insertShoeVariants(client, productId)
        await tagAsZapatos(client, productId)
        await client.query("COMMIT")
        imported++
        console.log(`    OK ${photosOk}/${photos.length} photos, ${productId}`)
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(`    INSERT failed: ${e.message}`)
        failed++
      }
    }
  }

  console.log(
    `\n=== DONE: ${categories.length} cats, ${totalSeen} albums seen, ${imported} imported, ${already} already-existed, chinese=${chineseSkipped} info=${infoSkipped} failed=${failed} ===`,
  )
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
