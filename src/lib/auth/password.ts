import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto"

const KEY_LEN = 64
// Node default scrypt params: N=16384, r=8, p=1 — strong for 2026.
// Documenting the values here so we can rotate later if needed.
const SCRYPT_PARAMS = "scrypt$16384$8$1"

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = scryptSync(plain, salt, KEY_LEN)
  return `${SCRYPT_PARAMS}$${salt.toString("hex")}$${derived.toString("hex")}`
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$")
    if (parts.length !== 6 || parts[0] !== "scrypt") return false
    const salt = Buffer.from(parts[4], "hex")
    const expected = Buffer.from(parts[5], "hex")
    const derived = scryptSync(plain, salt, expected.length)
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
