import {
  pgTable,
  pgEnum,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

const id = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${createId()}`)

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}

const softDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}

export const provinceEnum = pgEnum("province", [
  "PINAR_DEL_RIO",
  "ARTEMISA",
  "LA_HABANA",
  "MAYABEQUE",
  "MATANZAS",
])

export const leagueEnum = pgEnum("league", ["NBA", "NFL", "MLB", "FUTBOL", "OTRO"])

export const versionTypeEnum = pgEnum("version_type", [
  "home",
  "away",
  "alternate",
  "retro",
  "city",
  "all_star",
  "throwback",
  "other",
])

export const sizeEnum = pgEnum("size", [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL",
  // Legacy kids buckets — kept so existing variants don't break, but
  // new products use the age-specific KIDS_4..KIDS_14 below.
  "KIDS_S", "KIDS_M", "KIDS_L", "KIDS_XL",
  "KIDS_4", "KIDS_6", "KIDS_8", "KIDS_10", "KIDS_12", "KIDS_14",
  "WOMEN_S", "WOMEN_M", "WOMEN_L", "WOMEN_XL",
  "ONE_SIZE",
])

export const productStatusEnum = pgEnum("product_status", ["draft", "published", "archived"])

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
])

export const paymentStatusEnum = pgEnum("payment_status_t", [
  "unpaid",
  "proof_uploaded",
  "verified",
  "failed",
  "refunded",
])

export const fulfillmentStatusEnum = pgEnum("fulfillment_status_t", [
  "unfulfilled",
  "preparing",
  "shipped",
  "delivered",
  "returned",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "transfermovil",
  "cash_on_delivery",
  "zelle",
  "paypal",
])

export const adminRoleEnum = pgEnum("admin_role", ["owner", "manager", "staff", "viewer"])

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected", "hidden"])

export const customRequestStatusEnum = pgEnum("custom_request_status", [
  "pending",
  "quoted",
  "accepted",
  "rejected",
  "converted",
])

export const stockMovementReasonEnum = pgEnum("stock_movement_reason", [
  "sale",
  "restock",
  "return",
  "adjustment",
  "damaged",
  "lost",
])

export const couponTypeEnum = pgEnum("coupon_type", ["percentage", "fixed_amount", "free_shipping"])

export const couponAppliesToEnum = pgEnum("coupon_applies_to", ["all", "category", "product"])

export const subscriberStatusEnum = pgEnum("subscriber_status", ["active", "unsubscribed", "bounced"])

export const subscriberSourceEnum = pgEnum("subscriber_source", [
  "popup",
  "footer",
  "checkout",
  "manual",
])

export const notificationChannelEnum = pgEnum("notification_channel", ["whatsapp", "email", "sms"])

export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed"])

export const eventTypeEnum = pgEnum("event_type", [
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_start",
  "purchase",
])

export const preorderPaymentPolicyEnum = pgEnum("preorder_payment_policy", [
  "full",
  "deposit_only",
  "pay_on_arrival",
])

export const currencies = pgTable("currencies", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  rateToUsd: numeric("rate_to_usd", { precision: 14, scale: 6 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  updatedBy: text("updated_by").references((): AnyPgColumn => adminUsers.id),
  ...timestamps,
})

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by").references((): AnyPgColumn => adminUsers.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id("adm"),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    role: adminRoleEnum("role").notNull().default("staff"),
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastLoginIp: text("last_login_ip"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    invitedBy: text("invited_by"),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
  }),
)

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: id("ses"),
    adminId: text("admin_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("admin_sessions_token_idx").on(t.tokenHash),
    adminIdx: index("admin_sessions_admin_idx").on(t.adminId),
  }),
)

export const adminActivityLog = pgTable(
  "admin_activity_log",
  {
    id: id("act"),
    adminId: text("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    adminIdx: index("admin_activity_admin_idx").on(t.adminId),
    entityIdx: index("admin_activity_entity_idx").on(t.entityType, t.entityId),
    createdIdx: index("admin_activity_created_idx").on(t.createdAt),
  }),
)

export const categories = pgTable(
  "categories",
  {
    id: id("cat"),
    parentId: text("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    position: integer("position").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
    parentIdx: index("categories_parent_idx").on(t.parentId),
  }),
)

export const tags = pgTable(
  "tags",
  {
    id: id("tag"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("tags_slug_idx").on(t.slug),
  }),
)

export const products = pgTable(
  "products",
  {
    id: id("prod"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    brand: text("brand"),
    team: text("team"),
    playerName: text("player_name"),
    playerNumber: text("player_number"),
    season: text("season"),
    league: leagueEnum("league"),
    versionType: versionTypeEnum("version_type"),
    status: productStatusEnum("status").notNull().default("draft"),
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
    costPerItem: numeric("cost_per_item", { precision: 10, scale: 2 }),
    weightGrams: integer("weight_grams"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    isPreorder: boolean("is_preorder").notNull().default(false),
    preorderReleaseDate: date("preorder_release_date"),
    preorderPaymentPolicy: preorderPaymentPolicyEnum("preorder_payment_policy"),
    createdBy: text("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
    statusIdx: index("products_status_idx").on(t.status),
    teamIdx: index("products_team_idx").on(t.team),
    leagueIdx: index("products_league_idx").on(t.league),
    featuredIdx: index("products_featured_idx").on(t.featured),
  }),
)

export const variants = pgTable(
  "variants",
  {
    id: id("var"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    size: sizeEnum("size").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }),
    stock: integer("stock").notNull().default(0),
    lowStockAlert: integer("low_stock_alert").notNull().default(3),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    skuIdx: uniqueIndex("variants_sku_idx").on(t.sku),
    productIdx: index("variants_product_idx").on(t.productId),
  }),
)

export const productImages = pgTable(
  "product_images",
  {
    id: id("img"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => variants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    width: integer("width"),
    height: integer("height"),
    fileSizeKb: integer("file_size_kb"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index("product_images_product_idx").on(t.productId),
    variantIdx: index("product_images_variant_idx").on(t.variantId),
  }),
)

export const productCategories = pgTable(
  "product_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
  }),
)

export const productTags = pgTable(
  "product_tags",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.tagId] }),
  }),
)

export const customers = pgTable(
  "customers",
  {
    id: id("cus"),
    phone: text("phone"),
    email: text("email"),
    name: text("name").notNull(),
    country: text("country").notNull().default("CU"),
    isDiaspora: boolean("is_diaspora").notNull().default(false),
    hasAccount: boolean("has_account").notNull().default(false),
    passwordHash: text("password_hash"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    phoneIdx: uniqueIndex("customers_phone_idx").on(t.phone),
    emailIdx: index("customers_email_idx").on(t.email),
    countryIdx: index("customers_country_idx").on(t.country),
  }),
)

export const addresses = pgTable(
  "addresses",
  {
    id: id("adr"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    street: text("street").notNull(),
    number: text("number"),
    betweenStreets: text("between_streets"),
    neighborhood: text("neighborhood"),
    municipality: text("municipality").notNull(),
    province: provinceEnum("province").notNull(),
    zipCode: text("zip_code"),
    reference: text("reference"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    customerIdx: index("addresses_customer_idx").on(t.customerId),
  }),
)

export const orders = pgTable(
  "orders",
  {
    id: id("ord"),
    orderNumber: text("order_number").notNull(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("unfulfilled"),

    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
    discountTotal: numeric("discount_total", { precision: 10, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),

    shippingAddressId: text("shipping_address_id").references(() => addresses.id, { onDelete: "set null" }),
    shippingMethod: text("shipping_method"),

    paymentMethod: paymentMethodEnum("payment_method"),
    notesCustomer: text("notes_customer"),
    notesInternal: text("notes_internal"),
    couponCode: text("coupon_code"),

    // Preorder accounting. When the cart has any isPreorder=true item,
    // the customer pays a deposit upfront and the balance on arrival.
    // For pure in-stock orders both stay null and the existing total is
    // what the customer pays once.
    depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
    balanceAmount: numeric("balance_amount", { precision: 10, scale: 2 }),
    depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true }),
    balancePaidAt: timestamp("balance_paid_at", { withTimezone: true }),
    /** Tracks Ever's side of the preorder: not_started | sourcing | in_transit | arrived. */
    sourcingStatus: text("sourcing_status"),
    arrivedAtStockAt: timestamp("arrived_at_stock_at", { withTimezone: true }),

    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledReason: text("cancelled_reason"),

    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    orderNumberIdx: uniqueIndex("orders_order_number_idx").on(t.orderNumber),
    customerIdx: index("orders_customer_idx").on(t.customerId),
    statusIdx: index("orders_status_idx").on(t.status),
    placedAtIdx: index("orders_placed_at_idx").on(t.placedAt),
  }),
)

export const orderItems = pgTable(
  "order_items",
  {
    id: id("oitm"),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => variants.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    variantSize: text("variant_size"),
    sku: text("sku"),
    imageUrl: text("image_url"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    // Add-ons selected at checkout — null when none. Shape:
    // { longSleeves: bool, patches: bool, playerName?: string,
    //   playerNumber?: string, total: number }
    addOns: jsonb("add_ons"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_items_order_idx").on(t.orderId),
    variantIdx: index("order_items_variant_idx").on(t.variantId),
  }),
)

export const payments = pgTable(
  "payments",
  {
    id: id("pay"),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    proofUrl: text("proof_url"),
    proofUploadedAt: timestamp("proof_uploaded_at", { withTimezone: true }),
    transactionRef: text("transaction_ref"),
    status: paymentStatusEnum("status").notNull().default("unpaid"),
    verifiedBy: text("verified_by").references(() => adminUsers.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    ...timestamps,
  },
  (t) => ({
    orderIdx: index("payments_order_idx").on(t.orderId),
    statusIdx: index("payments_status_idx").on(t.status),
  }),
)

export const reviews = pgTable(
  "reviews",
  {
    id: id("rev"),
    // Optional: customers can leave a general M90 review without picking
    // a specific product. Per-product pages filter `productId IS NOT NULL`;
    // the all-reviews page shows both kinds.
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    // numeric(2,1) so we can store half-star ratings (3.5, 4.5...).
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
    title: text("title"),
    body: text("body").notNull(),
    photoUrl: text("photo_url"),
    status: reviewStatusEnum("status").notNull().default("pending"),
    adminResponse: text("admin_response"),
    adminResponseAt: timestamp("admin_response_at", { withTimezone: true }),
    helpfulCount: integer("helpful_count").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    productIdx: index("reviews_product_idx").on(t.productId),
    statusIdx: index("reviews_status_idx").on(t.status),
    ratingCheck: sql`CHECK (rating >= 1 AND rating <= 5)`,
  }),
)

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: id("sm"),
    variantId: text("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: stockMovementReasonEnum("reason").notNull(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    adminId: text("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    variantIdx: index("stock_movements_variant_idx").on(t.variantId),
    createdIdx: index("stock_movements_created_idx").on(t.createdAt),
  }),
)

export const coupons = pgTable(
  "coupons",
  {
    id: id("cpn"),
    code: text("code").notNull(),
    type: couponTypeEnum("type").notNull(),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    minPurchase: numeric("min_purchase", { precision: 10, scale: 2 }),
    maxUses: integer("max_uses"),
    maxUsesPerCustomer: integer("max_uses_per_customer").notNull().default(1),
    usedCount: integer("used_count").notNull().default(0),
    appliesTo: couponAppliesToEnum("applies_to").notNull().default("all"),
    appliesToId: text("applies_to_id"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    codeIdx: uniqueIndex("coupons_code_idx").on(t.code),
  }),
)

export const carts = pgTable(
  "carts",
  {
    id: id("cart"),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    sessionToken: text("session_token").notNull(),
    recoveredEmail: text("recovered_email"),
    recoveredPhone: text("recovered_phone"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: uniqueIndex("carts_session_idx").on(t.sessionToken),
    customerIdx: index("carts_customer_idx").on(t.customerId),
  }),
)

export const cartItems = pgTable(
  "cart_items",
  {
    id: id("citm"),
    cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    variantId: text("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps,
  },
  (t) => ({
    uniqIdx: uniqueIndex("cart_items_uniq_idx").on(t.cartId, t.variantId),
  }),
)

export const shippingZones = pgTable("shipping_zones", {
  id: id("sz"),
  name: text("name").notNull(),
  provinces: jsonb("provinces").notNull(),
  baseCost: numeric("base_cost", { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }),
  estimatedDaysMin: integer("estimated_days_min"),
  estimatedDaysMax: integer("estimated_days_max"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
})

export const customRequests = pgTable(
  "custom_requests",
  {
    id: id("creq"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    requestText: text("request_text").notNull(),
    referenceImages: jsonb("reference_images"),
    referenceLinks: jsonb("reference_links"),
    desiredSize: text("desired_size"),
    desiredQuantity: integer("desired_quantity").notNull().default(1),
    status: customRequestStatusEnum("status").notNull().default("pending"),
    quotedPrice: numeric("quoted_price", { precision: 10, scale: 2 }),
    quoteNotes: text("quote_notes"),
    quotedBy: text("quoted_by").references(() => adminUsers.id, { onDelete: "set null" }),
    quotedAt: timestamp("quoted_at", { withTimezone: true }),
    convertedOrderId: text("converted_order_id").references(() => orders.id, { onDelete: "set null" }),
    adminNotes: text("admin_notes"),
    ...timestamps,
  },
  (t) => ({
    statusIdx: index("custom_requests_status_idx").on(t.status),
  }),
)

export const subscribers = pgTable("subscribers", {
  id: id("sub"),
  email: text("email"),
  phone: text("phone"),
  source: subscriberSourceEnum("source").notNull(),
  status: subscriberStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const events = pgTable(
  "events",
  {
    id: id("evt"),
    type: eventTypeEnum("type").notNull(),
    sessionId: text("session_id"),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => variants.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    metadata: jsonb("metadata"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("events_type_idx").on(t.type),
    sessionIdx: index("events_session_idx").on(t.sessionId),
    createdIdx: index("events_created_idx").on(t.createdAt),
  }),
)

/**
 * Rate-limit buckets. One row per (key, window). Updated via UPSERT.
 * Stale rows (reset_at < now) are ignored by the limiter and pruned by maintenance.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resetAtIdx: index("rate_limits_reset_at_idx").on(t.resetAt),
  }),
)

/**
 * IP banlist. Populated by the security layer on serious abuse
 * (honeypot trip, repeated 4xx, traffic floods).
 */
export const bannedIps = pgTable(
  "banned_ips",
  {
    ip: text("ip").primaryKey(),
    reason: text("reason").notNull(),
    hits: integer("hits").notNull().default(1),
    bannedAt: timestamp("banned_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    expiresIdx: index("banned_ips_expires_idx").on(t.expiresAt),
  }),
)

export const notifications = pgTable(
  "notifications",
  {
    id: id("ntf"),
    type: text("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    relatedId: text("related_id"),
    status: notificationStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("notifications_status_idx").on(t.status),
    createdIdx: index("notifications_created_idx").on(t.createdAt),
  }),
)

export const productsRelations = relations(products, ({ many, one }) => ({
  variants: many(variants),
  images: many(productImages),
  categories: many(productCategories),
  tags: many(productTags),
  reviews: many(reviews),
  createdBy: one(adminUsers, {
    fields: [products.createdBy],
    references: [adminUsers.id],
  }),
}))

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  images: many(productImages),
  stockMovements: many(stockMovements),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(variants, {
    fields: [productImages.variantId],
    references: [variants.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_child",
  }),
  children: many(categories, { relationName: "parent_child" }),
  productCategories: many(productCategories),
}))

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}))

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  carts: many(carts),
}))

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id],
  }),
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  verifiedBy: one(adminUsers, {
    fields: [payments.verifiedBy],
    references: [adminUsers.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [reviews.customerId],
    references: [customers.id],
  }),
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  variant: one(variants, {
    fields: [stockMovements.variantId],
    references: [variants.id],
  }),
  order: one(orders, {
    fields: [stockMovements.orderId],
    references: [orders.id],
  }),
  admin: one(adminUsers, {
    fields: [stockMovements.adminId],
    references: [adminUsers.id],
  }),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(variants, {
    fields: [cartItems.variantId],
    references: [variants.id],
  }),
}))

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  activityLog: many(adminActivityLog),
  productsCreated: many(products),
}))

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminSessions.adminId],
    references: [adminUsers.id],
  }),
}))

export const customRequestsRelations = relations(customRequests, ({ one }) => ({
  quotedBy: one(adminUsers, {
    fields: [customRequests.quotedBy],
    references: [adminUsers.id],
  }),
  convertedOrder: one(orders, {
    fields: [customRequests.convertedOrderId],
    references: [orders.id],
  }),
}))
