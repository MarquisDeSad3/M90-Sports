import { z } from "zod"

/**
 * Strict input schema for POST /api/orders.
 *
 * `.strict()` rejects unknown fields so an attacker can't smuggle
 * extra keys into our DB inserts. Every string has an upper bound to
 * prevent payload-size DoS (writing 100MB into `notesCustomer`).
 */
const phoneRegex = /^\+?[\d\s().-]{6,20}$/

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Requerido")
    .max(max, `Máximo ${max} caracteres`)

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined))

export const orderAddOnsSchema = z
  .object({
    longSleeves: z.boolean().optional(),
    patches: z.boolean().optional(),
    playerName: z
      .string()
      .trim()
      .max(20)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    playerNumber: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, "Solo 1-3 dígitos")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    total: z.number().min(0).max(100),
  })
  .strict()

export const orderItemSchema = z
  .object({
    // Variant IDs from createId() are var_<cuid2>, but legacy IDs from
    // the base44 migration are var_b44_<hex> (extra underscore + dash
    // possible). Allow both — only the prefix matters as a sanity check.
    variantId: trimmed(64).regex(
      /^var_[a-z0-9_-]+$/i,
      "ID de variante inválido",
    ),
    quantity: z
      .number()
      .int("Cantidad debe ser entero")
      .min(1, "Mínimo 1")
      .max(20, "Máximo 20 por línea"),
    addOns: orderAddOnsSchema.optional(),
  })
  .strict()

export const customerSchema = z
  .object({
    name: trimmed(120),
    phone: trimmed(20).regex(phoneRegex, "Teléfono inválido"),
    // Email is optional but must be a valid address when present.
    // The .email() validator accepts the empty string oddly, so we
    // bridge through optionalTrimmed() to coerce "" → undefined first.
    email: optionalTrimmed(120).refine(
      (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { message: "Email inválido" },
    ),
    // Country code is usually ISO-2 ("CU", "US", "ES") but the form
    // also sends "OTHER" for the "Otro" option in the diaspora picker.
    country: optionalTrimmed(40),
  })
  .strict()

export const shippingAddressSchema = z
  .object({
    recipientName: trimmed(120),
    phone: trimmed(20).regex(phoneRegex, "Teléfono inválido"),
    street: trimmed(160),
    number: optionalTrimmed(20),
    betweenStreets: optionalTrimmed(80),
    neighborhood: optionalTrimmed(80),
    municipality: trimmed(80),
    province: z.enum([
      "PINAR_DEL_RIO",
      "ARTEMISA",
      "LA_HABANA",
      "MAYABEQUE",
      "MATANZAS",
    ]),
    reference: optionalTrimmed(240),
  })
  .strict()

// Métodos vivos. Pedidos legacy con paymentMethod="transfermovil"
// existen en BD pero ya no son aceptables como input nuevo.
export const paymentMethodSchema = z.enum([
  "cash_on_delivery",
  "zelle",
  "paypal",
])

export const orderInputSchema = z
  .object({
    items: z
      .array(orderItemSchema)
      .min(1, "El carrito está vacío")
      .max(20, "Demasiadas líneas en el pedido"),
    customer: customerSchema,
    shippingAddress: shippingAddressSchema,
    paymentMethod: paymentMethodSchema,
    notesCustomer: optionalTrimmed(500),
    couponCode: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal("").transform(() => undefined)),

    // Anti-bot signals — see lib/security/rate-limit.ts.
    // Honeypot input — must be empty.
    _hp: z.string().max(0).optional().or(z.literal("")),
    // Page-render timestamp set by the client when the checkout mounted.
    _t: z.number().int().positive().optional(),
  })
  .strict()

export type OrderInput = z.infer<typeof orderInputSchema>
