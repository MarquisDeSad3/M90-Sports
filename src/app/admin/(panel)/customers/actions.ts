"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"
import { db } from "@/lib/db"
import { customers } from "@/lib/db/schema"
import { requireAdminRole } from "@/lib/auth"

export type ActionResult =
  | { ok: true; customerId: string }
  | { ok: false; error: string }

const customerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s().-]{6,20}$/, "Teléfono inválido")
      .max(20),
    email: z
      .string()
      .trim()
      .email()
      .max(120)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    country: z.string().trim().min(2).max(40),
    isDiaspora: z.boolean(),
    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    marketingConsent: z.boolean(),
  })
  .strict()

/**
 * Create a customer record manually from /admin/customers/new. The
 * checkout flow does this automatically on first order; this is for
 * the case where Ever wants to seed a contact (typically because they
 * sold offline and want the person tracked from now on).
 *
 * If a customer with the same phone already exists, returns that
 * customer's id with `ok: true` instead of erroring — so re-submitting
 * the form is safe and the admin gets sent to the existing record.
 */
export async function createCustomerAction(
  input: z.input<typeof customerSchema>,
): Promise<ActionResult> {
  try {
    await requireAdminRole("staff")
  } catch (err) {
    return {
      ok: false,
      error:
        (err as Error)?.message === "FORBIDDEN"
          ? "Sin permisos."
          : "No autenticado.",
    }
  }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }
  const data = parsed.data

  try {
    // Phone uniqueness — match the public checkout's behavior so the
    // same person isn't duplicated.
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.phone, data.phone))
      .limit(1)
    if (existing.length > 0) {
      return { ok: true, customerId: existing[0]!.id }
    }

    const id = `cus_${createId()}`
    await db.insert(customers).values({
      id,
      phone: data.phone,
      email: data.email ?? null,
      name: data.name,
      country: data.country.toUpperCase().slice(0, 2),
      isDiaspora: data.isDiaspora,
      hasAccount: false,
      notes: data.notes ?? null,
      marketingConsent: data.marketingConsent,
    })

    revalidatePath("/admin/customers")
    revalidatePath("/admin")
    return { ok: true, customerId: id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error("[customers] create failed:", msg)
    return { ok: false, error: "No se pudo crear el cliente." }
  }
}
