import { drizzle } from "drizzle-orm/postgres-js"
import postgres, { type Sql } from "postgres"
import * as schema from "./schema"

// Lazy init: connection is only created the first time it's used.
// This way the module can be imported in environments where DATABASE_URL
// is not set (e.g. local preview without DB) without throwing on boot.
let _client: Sql | undefined
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

function getClient(): Sql {
  if (_client) return _client
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Configure it in your environment or .env.local for local dev."
    )
  }
  _client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return _client
}

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!_db) {
      _db = drizzle(getClient(), { schema })
    }
    return Reflect.get(_db, prop)
  },
}) as ReturnType<typeof drizzle<typeof schema>>

export { schema }
export type DB = typeof db
