// Aplica seed-accesorios.sql contra la BD apuntada por DATABASE_URL.
// Uso: npm run seed:accesorios
//
// Se ejecuta con `node --env-file=.env.local`, así no necesita dotenv
// como dependencia y la URL nunca se pasa por argv (no queda en
// historial de shell).

import postgres from "postgres"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SQL_FILE = resolve(__dirname, "..", "seed-accesorios.sql")

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    "[seed-accesorios] DATABASE_URL no está definida.\n" +
      "Crea m90-sports/.env.local con DATABASE_URL=postgres://… y vuelve a intentarlo.",
  )
  process.exit(1)
}

const sql = readFileSync(SQL_FILE, "utf8")
const client = postgres(url, { max: 1, idle_timeout: 5 })

try {
  console.log("[seed-accesorios] aplicando", SQL_FILE)
  await client.unsafe(sql)

  const rows = await client`
    SELECT id, slug, name, parent_id, position, visible
    FROM categories
    WHERE slug = 'accesorios'
  `
  if (rows.length === 0) {
    console.error("[seed-accesorios] no se encontró la fila tras el INSERT.")
    process.exitCode = 1
  } else {
    console.log("[seed-accesorios] OK:", rows[0])
    console.log(
      "\nSiguiente paso: entra a /admin/products y asigna tus llaveros\n" +
        "a la categoría 'Accesorios'. La tab aparecerá sola en /tienda.",
    )
  }
} catch (err) {
  console.error("[seed-accesorios] error:", err)
  process.exitCode = 1
} finally {
  await client.end()
}
