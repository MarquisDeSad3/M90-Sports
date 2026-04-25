import { NextResponse } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { adminUsers } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Bootstrap endpoint to create the first admin (owner).
 *
 * - Only works while there are zero admin_users in DB.
 * - Once an admin exists, this endpoint returns 403.
 *
 * Required ADMIN_SEED_TOKEN env var must be present and provided in the
 * request body for the call to succeed (defense in depth in case the
 * endpoint is hit before the first admin is bootstrapped).
 */
export async function POST(request: Request) {
  const seedToken = process.env.ADMIN_SEED_TOKEN
  if (!seedToken) {
    return NextResponse.json(
      { error: "Seed not configured." },
      { status: 503 }
    )
  }

  let body: {
    email?: string
    password?: string
    name?: string
    seedToken?: string
  } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!body.seedToken || body.seedToken !== seedToken) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const email = (body.email ?? "").trim().toLowerCase()
  const password = body.password ?? ""
  const name = (body.name ?? "").trim()

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "email, password and name are required." },
      { status: 400 }
    )
  }
  if (password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters." },
      { status: 400 }
    )
  }

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An admin already exists. Seed endpoint disabled." },
      { status: 403 }
    )
  }

  const id = `adm_${createId()}`
  const passwordHash = await hashPassword(password)

  await db.insert(adminUsers).values({
    id,
    email,
    passwordHash,
    name,
    role: "owner",
    twoFactorEnabled: false,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return NextResponse.json({
    id,
    email,
    name,
    role: "owner",
    message: "Admin created. You can now login at /admin/login.",
  })
}
