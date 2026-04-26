#!/usr/bin/env node
/**
 * Scraper for https://wsp007.x.yupoo.com/.
 *
 * Strategy:
 *   1. Walk /albums/?page=N until a page returns no albums.
 *   2. For each album, extract id + title + cover from the listing
 *      and skip the obvious info pages (Shipping, Service, Size, etc.).
 *   3. Fetch the album detail page, extract every photo URL inside.
 *   4. Download each photo to UPLOAD_DIR with a 32-hex name + ext.
 *   5. Insert one product row per album (status='draft', isPreorder=true)
 *      and one product_image row per downloaded photo.
 *
 * Defensive choices:
 *   - We cap pages with MAX_PAGES.
 *   - We cap photos per album with MAX_PHOTOS_PER_ALBUM.
 *   - We sleep between requests to avoid yupoo's rate limiter.
 *   - We never delete or update existing products — re-runs will skip
 *     albums whose Yupoo id is already in product.notesInternal.
 */

import { Client } from "pg"
import { writeFile, mkdir } from "node:fs/promises"
import { randomBytes, createHash } from "node:crypto"
import path from "node:path"

// --- Config ---
const BASE = "https://wsp007.x.yupoo.com"
// "All categories" listing — scrape every album, not just one category.
const LIST_PATH = "/albums?tab=gallery"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/m90-uploads"
const MAX_PAGES = Number(process.env.MAX_PAGES || 1) // start with 1 for testing
const MAX_PHOTOS_FAMOUS = 8 // products from famous teams get the full set
const MAX_PHOTOS_OTHER = 4  // others get a smaller sample
const SLEEP_MS = 400
const DEFAULT_PRICE = "0" // Ever sets the real price before publishing

const SKIP_TITLE_PATTERNS = [
  /question/i,
  /shipping/i,
  /\bhow to\b/i,
  /size (information|chart)/i,
  /service center/i,
  /^about /i,
]

/**
 * If the title mentions any of these names, we keep the product no matter
 * what — even if it's shoes, a backpack or a hat. The user wants the full
 * inventory of the famous teams/players.
 */
const FAMOUS_REGEX = new RegExp(
  [
    // Top clubs (and their common abbreviations)
    "real madrid", "\\br ?mad\\b", "barcelona", "\\bfcb\\b", "fc bayern",
    "manchester", "\\bmnu\\b", "\\bmci\\b", "liverpool", "\\bliv\\b",
    "chelsea", "\\bche\\b", "arsenal", "\\bars\\b", "tottenham",
    "paris saint", "\\bpsg\\b", "bayern", "dortmund", "juventus", "juve",
    "inter milan", "ac milan", "atletico", "atlético", "napoli",
    "inter miami", "boca", "river plate", "flamengo", "palmeiras",
    // Top national teams
    "argentina", "brasil", "brazil", "francia", "france", "inglaterra",
    "england", "españa", "spain", "portugal", "alemania", "germany",
    "italia", "italy", "marruecos", "morocco", "croacia", "croatia",
    "holanda", "netherlands", "belgica", "belgium", "mexico", "méxico",
    "japon", "japan", "uruguay", "colombia", "cuba",
    // Star players
    "messi", "ronaldo", "mbapp", "vinicius", "neymar", "yamal",
    "bellingham", "haaland", "modric", "pedri", "lewandowski",
    "lebron", "curry", "jordan", "kobe", "doncic", "tatum", "giannis",
    "antetokounmpo", "embiid", "brunson", "edwards", "gilgeous",
    "halliburton", "haliburton", "siakam", "durant",
    // NBA top teams
    "lakers", "bulls", "warriors", "celtics", "heat", "knicks",
    "76ers", "sixers", "mavericks", "bucks", "thunder", "nuggets",
  ].join("|"),
  "i",
)

/**
 * Hard-skip patterns for non-famous products. Keychains, backpacks,
 * Chinese new year jackets etc. that the user doesn't want unless
 * they're tied to a famous team.
 */
const NONFAMOUS_BAD_REGEX = new RegExp(
  [
    "keychain", "backpack", "down jacket", "windbreak", "coats and",
    "hoodie sweater", "running shoes", "soccer boots", "beanie",
    "cap collection", "hat collection", "pants and shorts", "track suit",
    "jacket and pants", "m92 maya", "lyndale", "cleats only",
    "moose knuckles", "tang-style", "chinese new year", "hair collar",
    "cocio bag", "yeezy", "scissors",
  ].join("|"),
  "i",
)

/**
 * For non-famous products we want at least one positive signal that this
 * is a wearable football / NBA / kids garment. If neither famous nor a
 * jersey-keyword, skip.
 */
const KEEP_REGEX = new RegExp(
  [
    "jersey", "\\bkit\\b", "shirt", "world cup", "player version",
    "fan version", "long sleev", "short sleev", "soccer", "football",
    "polo", "hoodie", "vest", "training", "rugby", "f1 jersey",
    "\\bnfl\\b", "\\bmlb\\b", "\\bnba\\b",
    "retro", "vintage", "classic", "legends",
    "kids", "niños", "child", "youth", "baby", "bebé",
  ].join("|"),
  "i",
)

function classifyTitle(title) {
  if (/[\u4e00-\u9fff]/.test(title)) return "skip:chinese"
  if (FAMOUS_REGEX.test(title)) return "keep:famous"
  if (NONFAMOUS_BAD_REGEX.test(title)) return "skip:bad"
  if (KEEP_REGEX.test(title)) return "keep:generic"
  return "skip:irrelevant"
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

/** Sniff first 12 bytes for jpg/png/webp/gif. */
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
  // Yupoo's photo CDN (TencentEdgeOne) returns HTTP 567 without a
  // matching Referer. The 567 is custom/non-standard, so the standard
  // res.ok check still treats it as a failure — we just need to send
  // the Referer to get a 200 in the first place.
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

/** Listing page — returns array of { yupooId, title, href, coverUrl }. */
function parseListing(html) {
  // Each tile has <a class="album__main" title="..." href="/albums/123?uid=1&...">
  // immediately followed by an <img ... src="https://photo.yupoo.com/...">.
  // We capture the FULL href because yupoo returns 404 if you fetch the
  // album without the referrercate/isSubCate query params it gave you.
  const re =
    /class="album__main"\s+title="([^"]+)"\s+href="(\/albums\/(\d+)[^"]*)"[^]*?<img[^>]+src="(https:\/\/photo\.yupoo\.com\/[^"]+)"/g
  const out = []
  let m
  while ((m = re.exec(html))) {
    out.push({
      title: decodeHtml(m[1]),
      href: decodeHtml(m[2]),
      yupooId: m[3],
      coverUrl: m[4],
    })
  }
  return out
}

/** Album detail — every photo's CDN URL inside. */
function parseAlbum(html) {
  // Yupoo's album page lists each photo as <img ... src="https://photo.yupoo.com/..." ...>
  // We dedupe and skip thumbnails of the same photo.
  const urls = new Set()
  const re = /src="(https:\/\/photo\.yupoo\.com\/[^"]+\.(?:jpg|jpeg|png|webp|gif))"/gi
  let m
  while ((m = re.exec(html))) {
    // Prefer a "medium" or larger version when both exist by stripping the
    // size suffix; we'll keep the URL as-is regardless.
    urls.add(m[1])
  }
  return [...urls]
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

function shouldSkipInfoPage(title) {
  return SKIP_TITLE_PATTERNS.some((re) => re.test(title))
}

/** Stable product id derived from yupoo album id, so re-runs detect dups. */
function productIdFor(yupooId) {
  const h = createHash("sha256").update(`yupoo:${yupooId}`).digest("hex").slice(0, 24)
  return `prod_yp_${h}`
}

async function alreadyImported(client, productId) {
  const r = await client.query("SELECT 1 FROM products WHERE id = $1 LIMIT 1", [productId])
  return r.rowCount > 0
}

async function insertProduct(client, { id, slug, name, yupooId }) {
  // The product id (prod_yp_<sha-of-yupooId>) is what we use to detect
  // re-imports — see alreadyImported(). We embed the source ref in the
  // description for forensics; Ever can edit/clear it before publishing.
  const description = `[Importado de Yupoo · album ${yupooId}]`
  try {
    await client.query(
      `INSERT INTO products
       (id, slug, name, description, status, base_price, featured,
        is_preorder, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', $5, false, true, 0, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [id, slug, name, description, DEFAULT_PRICE],
    )
  } catch (err) {
    // Slug collisions are common when titles overlap; retry with a suffix.
    if (String(err.message).includes("products_slug_idx")) {
      const altSlug = `${slug}-${yupooId.slice(-6)}`
      await client.query(
        `INSERT INTO products
         (id, slug, name, description, status, base_price, featured,
          is_preorder, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'draft', $5, false, true, 0, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [id, altSlug, name, description, DEFAULT_PRICE],
      )
    } else {
      throw err
    }
  }
}

async function insertImage(client, { productId, url, isPrimary, position }) {
  await client.query(
    `INSERT INTO product_images (id, product_id, url, alt, position, is_primary, created_at)
     VALUES ($1, $2, $3, NULL, $4, $5, NOW())`,
    [`img_yp_${randomBytes(8).toString("hex")}`, productId, url, position, isPrimary],
  )
}

async function insertDefaultVariants(client, productId) {
  const sizes = ["S", "M", "L", "XL", "XXL"]
  for (let i = 0; i < sizes.length; i++) {
    const variantId = `var_yp_${randomBytes(8).toString("hex")}`
    const sku = `YP-${productId.slice(-6)}-${sizes[i]}`
    await client.query(
      `INSERT INTO variants (id, product_id, sku, size, stock, low_stock_alert, allow_backorder, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 999, 3, true, $5, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [variantId, productId, sku, sizes[i], i],
    )
  }
}

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://m90:6qg9dq9nn63Swjnkd6J5kVnAIy617dFHudoYU0Q7rdWtUutd2UtUU0V0KqUgWvsp@localhost:5432/m90_sports",
  })
  await client.connect()

  let totalAlbums = 0
  let imported = 0
  let already = 0
  const skipCounts = { chinese: 0, bad: 0, irrelevant: 0, info: 0 }

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = page === 1 ? `${BASE}${LIST_PATH}` : `${BASE}${LIST_PATH}&page=${page}`
    console.log(`\n=== Page ${page}: ${url} ===`)
    let html
    try {
      html = await fetchHtml(url)
    } catch (e) {
      console.error(`  fetch failed: ${e.message}`)
      break
    }
    const tiles = parseListing(html)
    console.log(`  ${tiles.length} albums on this page`)
    if (tiles.length === 0) break

    for (const tile of tiles) {
      totalAlbums++
      if (shouldSkipInfoPage(tile.title)) {
        skipCounts.info++
        continue
      }
      const verdict = classifyTitle(tile.title)
      if (verdict.startsWith("skip:")) {
        if (verdict === "skip:chinese") skipCounts.chinese++
        else if (verdict === "skip:bad") skipCounts.bad++
        else skipCounts.irrelevant++
        continue
      }

      const productId = productIdFor(tile.yupooId)
      if (await alreadyImported(client, productId)) {
        already++
        continue
      }

      const photoCap =
        verdict === "keep:famous" ? MAX_PHOTOS_FAMOUS : MAX_PHOTOS_OTHER
      console.log(`  → [${verdict}] "${tile.title}"`)

      // Get photos from the album detail page. We pass the FULL href
      // including query params from the listing, otherwise yupoo 404s.
      let albumHtml
      try {
        await sleep(SLEEP_MS)
        albumHtml = await fetchHtml(`${BASE}${tile.href}`)
      } catch (e) {
        console.warn(`    detail fetch failed: ${e.message}`)
        continue
      }
      let photos = parseAlbum(albumHtml)
      // Always include the listing cover, in case the detail page didn't
      // surface it or only had thumbnails.
      photos = [tile.coverUrl, ...photos.filter((u) => u !== tile.coverUrl)]
      photos = photos.slice(0, photoCap)
      if (photos.length === 0) {
        console.warn(`    no photos found, skipping`)
        continue
      }

      try {
        await client.query("BEGIN")
        const slug = slugify(tile.title) || `producto-${tile.yupooId}`
        await insertProduct(client, {
          id: productId,
          slug,
          name: tile.title,
          yupooId: tile.yupooId,
        })

        let photosOk = 0
        for (let i = 0; i < photos.length; i++) {
          await sleep(150)
          try {
            const dl = await downloadPhoto(photos[i])
            await insertImage(client, {
              productId,
              url: dl.url,
              isPrimary: photosOk === 0, // first SUCCESSFUL one is primary
              position: i,
            })
            photosOk++
          } catch (e) {
            console.warn(`    photo ${i} failed: ${e.message}`)
          }
        }

        if (photosOk === 0) {
          // Don't keep a product nobody can see. Roll back the whole
          // album insert so we'll retry it cleanly next run.
          await client.query("ROLLBACK")
          console.warn(`    no photos downloaded — rolled back`)
          continue
        }

        await insertDefaultVariants(client, productId)
        await client.query("COMMIT")
        imported++
        console.log(`    OK ${photosOk}/${photos.length} photos, ${productId}`)
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {})
        console.error(`    INSERT failed: ${e.message}`)
      }
    }
  }

  console.log(
    `\n=== DONE: ${totalAlbums} albums seen, ${imported} imported, ${already} already-existed,
       skipped: chinese=${skipCounts.chinese} bad=${skipCounts.bad} irrelevant=${skipCounts.irrelevant} info=${skipCounts.info} ===`,
  )
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
