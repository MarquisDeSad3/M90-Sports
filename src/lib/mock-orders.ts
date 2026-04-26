/**
 * Mock orders data layer. Replace with Drizzle once VPS is live.
 */

/**
 * Order status union. Includes both the legacy mock states (used in
 * tests / fixtures) and the real schema enum the DB actually emits.
 * Keeping both prevents runtime crashes when an order created via
 * /api/orders ("pending") is rendered alongside mock data.
 */
export type OrderStatus =
  // Real schema states (orderStatusEnum)
  | "pending"               // came from web, awaiting confirmation
  | "confirmed"             // confirmed, awaiting payment
  | "shipped"               // in transit
  | "delivered"             // received by customer
  | "cancelled"             // cancelled (any stage)
  | "refunded"              // refunded
  // Legacy mock-only states (kept for backwards compat)
  | "pending_confirmation"
  | "payment_uploaded"
  | "paid"
  | "preparing"

export type PaymentMethodType =
  | "transfermovil"
  | "cash_on_delivery"
  | "zelle"
  | "paypal"

export type OrderSource =
  | "whatsapp_web"      // built cart on website, sent to WhatsApp
  | "whatsapp_direct"   // came directly via WhatsApp chat
  | "manual"            // admin created it from scratch

export interface MockOrderItem {
  id: string
  productId: string
  productName: string
  team: string
  number?: string
  variantSize: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface MockShippingAddress {
  recipientName: string
  phone: string
  street: string
  number?: string
  betweenStreets?: string
  neighborhood?: string
  municipality: string
  province: string
  reference?: string
}

export interface MockOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  source: OrderSource

  // Buyer (the one who pays — could be diaspora)
  customerName: string
  customerPhone: string
  customerEmail?: string
  isDiaspora: boolean
  country: string

  items: MockOrderItem[]
  subtotal: number
  shippingCost: number
  discountTotal: number
  total: number
  currency: string

  shippingAddress: MockShippingAddress
  shippingMethod: string

  paymentMethod: PaymentMethodType
  paymentVerified: boolean
  paymentTransactionRef?: string
  proofUploaded: boolean

  notesCustomer?: string
  notesInternal?: string
  whatsappPreview?: string
  couponCode?: string

  createdAt: string
  confirmedAt?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  cancelReason?: string
}

const now = (offsetMinutes = 0) => {
  const d = new Date("2026-04-25T15:00:00Z")
  d.setMinutes(d.getMinutes() - offsetMinutes)
  return d.toISOString()
}

export const mockOrders: MockOrder[] = [
  // 🟡 PENDING CONFIRMATION — Ever needs to confirm these
  {
    id: "ord_001253",
    orderNumber: "M90-001253",
    status: "pending_confirmation",
    source: "whatsapp_web",
    customerName: "Marta García",
    customerPhone: "+1 305 555 0123",
    customerEmail: "marta.g@gmail.com",
    isDiaspora: true,
    country: "US",
    items: [
      {
        id: "oitm_1",
        productId: "prod_lakers_bryant_9697",
        productName: "Jersey Lakers Kobe Bryant 1996-97",
        team: "Los Angeles Lakers",
        number: "8",
        variantSize: "L",
        unitPrice: 65,
        quantity: 2,
        subtotal: 130,
      },
    ],
    subtotal: 130,
    shippingCost: 10,
    discountTotal: 0,
    total: 140,
    currency: "USD",
    shippingAddress: {
      recipientName: "Jorge Pérez (sobrino)",
      phone: "+53 5234 5678",
      street: "Calle 23",
      number: "#456",
      betweenStreets: "entre J y K",
      neighborhood: "Vedado",
      municipality: "Plaza de la Revolución",
      province: "La Habana",
      reference: "Edificio amarillo, segundo piso",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "zelle",
    paymentVerified: false,
    proofUploaded: false,
    notesCustomer: "Es regalo para mi sobrino, por favor envuélvelo bonito si pueden",
    whatsappPreview:
      "Hola M90, quiero pedir 2 jerseys de los Lakers de Kobe, talla L. Son para mi sobrino en La Habana. Pago con Zelle.",
    createdAt: now(8),
  },
  {
    id: "ord_001252",
    orderNumber: "M90-001252",
    status: "pending_confirmation",
    source: "whatsapp_web",
    customerName: "Roberto Pérez",
    customerPhone: "+53 5612 3456",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_2",
        productId: "prod_real_madrid_bellingham",
        productName: "Real Madrid Bellingham #5 2024",
        team: "Real Madrid",
        number: "5",
        variantSize: "M",
        unitPrice: 75,
        quantity: 1,
        subtotal: 75,
      },
    ],
    subtotal: 75,
    shippingCost: 5,
    discountTotal: 0,
    total: 80,
    currency: "USD",
    shippingAddress: {
      recipientName: "Roberto Pérez",
      phone: "+53 5612 3456",
      street: "Avenida 31",
      number: "#1204",
      betweenStreets: "entre 60 y 62",
      municipality: "Playa",
      province: "La Habana",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "transfermovil",
    paymentVerified: false,
    proofUploaded: false,
    whatsappPreview:
      "Buenas, soy Roberto. Quiero el Bellingham 24 talla M. Pago Transfermóvil.",
    createdAt: now(34),
  },
  {
    id: "ord_001251",
    orderNumber: "M90-001251",
    status: "pending_confirmation",
    source: "whatsapp_web",
    customerName: "Liliana Cruz",
    customerPhone: "+34 612 345 678",
    customerEmail: "liliana.cruz@hotmail.com",
    isDiaspora: true,
    country: "ES",
    items: [
      {
        id: "oitm_3a",
        productId: "prod_argentina_messi_2022",
        productName: "Argentina Messi Mundial 2022 (3 estrellas)",
        team: "Argentina",
        number: "10",
        variantSize: "L",
        unitPrice: 80,
        quantity: 1,
        subtotal: 80,
      },
      {
        id: "oitm_3b",
        productId: "prod_argentina_messi_kids",
        productName: "Argentina Messi — Talla niños",
        team: "Argentina",
        number: "10",
        variantSize: "KIDS_M",
        unitPrice: 50,
        quantity: 2,
        subtotal: 100,
      },
    ],
    subtotal: 180,
    shippingCost: 15,
    discountTotal: 15,
    total: 180,
    currency: "USD",
    shippingAddress: {
      recipientName: "Yanela Cruz",
      phone: "+53 5345 6789",
      street: "Calle Milagros",
      number: "#308",
      betweenStreets: "entre Mayía Rodríguez y Sola",
      neighborhood: "Santos Suárez",
      municipality: "10 de Octubre",
      province: "La Habana",
      reference: "Casa rosada con reja blanca, frente al parque",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "paypal",
    paymentVerified: false,
    proofUploaded: false,
    notesCustomer: "Para mi hermana y mis sobrinos. Que lleguen antes del 5 de mayo si es posible.",
    whatsappPreview:
      "Hola, soy Liliana, vivo en Madrid. Quiero la de Argentina Messi talla L para mi hermana y 2 de niño talla M. ¿Tienen descuento por compra grande?",
    couponCode: "FAMILIA15",
    createdAt: now(67),
  },

  // 🟢 CONFIRMED — closed, awaiting payment
  {
    id: "ord_001250",
    orderNumber: "M90-001250",
    status: "confirmed",
    source: "whatsapp_direct",
    customerName: "Yoel Domínguez",
    customerPhone: "+53 5789 0123",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_4",
        productId: "prod_heat_lebron_2014",
        productName: "Jersey Heat LeBron James 2014",
        team: "Miami Heat",
        number: "6",
        variantSize: "L",
        unitPrice: 65,
        quantity: 1,
        subtotal: 65,
      },
    ],
    subtotal: 65,
    shippingCost: 8,
    discountTotal: 0,
    total: 73,
    currency: "USD",
    shippingAddress: {
      recipientName: "Yoel Domínguez",
      phone: "+53 5789 0123",
      street: "Carretera Central km 4",
      municipality: "San Juan y Martínez",
      province: "Pinar del Río",
      reference: "Casa de bloques, al lado de la bodega",
    },
    shippingMethod: "Cargo Pinar del Río",
    paymentMethod: "cash_on_delivery",
    paymentVerified: false,
    proofUploaded: false,
    notesInternal: "Cliente recurrente. Confirma cantidad por WhatsApp 25 abr.",
    createdAt: now(160),
    confirmedAt: now(140),
  },

  // 🟠 PAYMENT UPLOADED — needs verification
  {
    id: "ord_001249",
    orderNumber: "M90-001249",
    status: "payment_uploaded",
    source: "whatsapp_web",
    customerName: "Carlos Mendoza",
    customerPhone: "+53 5234 7891",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_5",
        productId: "prod_bulls_jordan_9596",
        productName: "Jersey Bulls Michael Jordan 1995-96",
        team: "Chicago Bulls",
        number: "23",
        variantSize: "XL",
        unitPrice: 65,
        quantity: 1,
        subtotal: 65,
      },
    ],
    subtotal: 65,
    shippingCost: 5,
    discountTotal: 0,
    total: 70,
    currency: "USD",
    shippingAddress: {
      recipientName: "Carlos Mendoza",
      phone: "+53 5234 7891",
      street: "Calle 70",
      number: "#1203",
      betweenStreets: "entre 11 y 13",
      municipality: "Playa",
      province: "La Habana",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "transfermovil",
    paymentVerified: false,
    paymentTransactionRef: "TM-20260425-7891",
    proofUploaded: true,
    createdAt: now(280),
    confirmedAt: now(260),
  },

  // 🔵 PAID — ready to prepare
  {
    id: "ord_001248",
    orderNumber: "M90-001248",
    status: "paid",
    source: "whatsapp_web",
    customerName: "Anelis Rodríguez",
    customerPhone: "+53 5891 2345",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_6",
        productId: "prod_real_madrid_2024",
        productName: "Real Madrid 2024 Home",
        team: "Real Madrid",
        variantSize: "S",
        unitPrice: 65,
        quantity: 1,
        subtotal: 65,
      },
      {
        id: "oitm_6b",
        productId: "prod_real_madrid_bellingham",
        productName: "Real Madrid Bellingham #5 2024",
        team: "Real Madrid",
        number: "5",
        variantSize: "M",
        unitPrice: 75,
        quantity: 1,
        subtotal: 75,
      },
    ],
    subtotal: 140,
    shippingCost: 5,
    discountTotal: 0,
    total: 145,
    currency: "USD",
    shippingAddress: {
      recipientName: "Anelis Rodríguez",
      phone: "+53 5891 2345",
      street: "Calle 19",
      number: "#502",
      betweenStreets: "entre B y C",
      neighborhood: "Vedado",
      municipality: "Plaza de la Revolución",
      province: "La Habana",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "transfermovil",
    paymentVerified: true,
    paymentTransactionRef: "TM-20260424-1234",
    proofUploaded: true,
    createdAt: now(720),
    confirmedAt: now(700),
    paidAt: now(540),
  },

  // 📦 PREPARING
  {
    id: "ord_001247",
    orderNumber: "M90-001247",
    status: "preparing",
    source: "whatsapp_web",
    customerName: "Daniel Suárez",
    customerPhone: "+53 5123 4567",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_7",
        productId: "prod_warriors_curry_city",
        productName: "Warriors Stephen Curry City Edition 2024",
        team: "Golden State Warriors",
        number: "30",
        variantSize: "M",
        unitPrice: 70,
        quantity: 1,
        subtotal: 70,
      },
    ],
    subtotal: 70,
    shippingCost: 5,
    discountTotal: 0,
    total: 75,
    currency: "USD",
    shippingAddress: {
      recipientName: "Daniel Suárez",
      phone: "+53 5123 4567",
      street: "Línea",
      number: "#809",
      betweenStreets: "entre 4 y 6",
      neighborhood: "Vedado",
      municipality: "Plaza de la Revolución",
      province: "La Habana",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "transfermovil",
    paymentVerified: true,
    paymentTransactionRef: "TM-20260424-9988",
    proofUploaded: true,
    notesInternal: "Empacar para entrega de mañana",
    createdAt: now(1440),
    confirmedAt: now(1430),
    paidAt: now(1200),
  },

  // 🚚 SHIPPED
  {
    id: "ord_001246",
    orderNumber: "M90-001246",
    status: "shipped",
    source: "whatsapp_direct",
    customerName: "Mariana López",
    customerPhone: "+1 786 555 0987",
    customerEmail: "mariana.lopez@yahoo.com",
    isDiaspora: true,
    country: "US",
    items: [
      {
        id: "oitm_8",
        productId: "prod_celtics_tatum_2024",
        productName: "Celtics Jayson Tatum 2024",
        team: "Boston Celtics",
        number: "0",
        variantSize: "L",
        unitPrice: 65,
        quantity: 1,
        subtotal: 65,
      },
    ],
    subtotal: 65,
    shippingCost: 12,
    discountTotal: 0,
    total: 77,
    currency: "USD",
    shippingAddress: {
      recipientName: "Andrés López",
      phone: "+53 5456 7890",
      street: "Calle Salud",
      number: "#458",
      betweenStreets: "entre Lealtad y Escobar",
      neighborhood: "Centro Habana",
      municipality: "Centro Habana",
      province: "La Habana",
      reference: "Casa azul de dos pisos",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "zelle",
    paymentVerified: true,
    paymentTransactionRef: "ZL-20260423-4521",
    proofUploaded: true,
    notesInternal: "Mensajero Yandri sale lunes 9am",
    createdAt: now(2880),
    confirmedAt: now(2870),
    paidAt: now(2700),
    shippedAt: now(900),
  },

  // ✅ DELIVERED
  {
    id: "ord_001245",
    orderNumber: "M90-001245",
    status: "delivered",
    source: "whatsapp_direct",
    customerName: "Pedro Castro",
    customerPhone: "+53 5345 6789",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_9",
        productId: "prod_brazil_pele_retro",
        productName: "Brasil Pelé 1970 Retro",
        team: "Brasil",
        number: "10",
        variantSize: "M",
        unitPrice: 70,
        quantity: 1,
        subtotal: 70,
      },
    ],
    subtotal: 70,
    shippingCost: 5,
    discountTotal: 0,
    total: 75,
    currency: "USD",
    shippingAddress: {
      recipientName: "Pedro Castro",
      phone: "+53 5345 6789",
      street: "Calle 10",
      number: "#235",
      betweenStreets: "entre 5ta y 3ra",
      municipality: "Miramar",
      province: "La Habana",
    },
    shippingMethod: "Mensajería propia",
    paymentMethod: "cash_on_delivery",
    paymentVerified: true,
    proofUploaded: false,
    createdAt: now(7200),
    confirmedAt: now(7190),
    paidAt: now(2880),
    shippedAt: now(2880),
    deliveredAt: now(2400),
  },

  // ❌ CANCELLED
  {
    id: "ord_001244",
    orderNumber: "M90-001244",
    status: "cancelled",
    source: "whatsapp_web",
    customerName: "Yanet Hernández",
    customerPhone: "+53 5678 9012",
    isDiaspora: false,
    country: "CU",
    items: [
      {
        id: "oitm_10",
        productId: "prod_psg_mbappe_2023",
        productName: "PSG Kylian Mbappé 2022-23",
        team: "Paris Saint-Germain",
        number: "7",
        variantSize: "L",
        unitPrice: 65,
        quantity: 1,
        subtotal: 65,
      },
    ],
    subtotal: 65,
    shippingCost: 5,
    discountTotal: 0,
    total: 70,
    currency: "USD",
    shippingAddress: {
      recipientName: "Yanet Hernández",
      phone: "+53 5678 9012",
      street: "Calle Real",
      municipality: "Cárdenas",
      province: "Matanzas",
    },
    shippingMethod: "Cargo Matanzas",
    paymentMethod: "cash_on_delivery",
    paymentVerified: false,
    proofUploaded: false,
    notesInternal: "Cliente canceló — encontró el jersey más barato en otra tienda",
    createdAt: now(4320),
    confirmedAt: now(4300),
    cancelledAt: now(3800),
    cancelReason: "Cliente solicitó cancelación",
  },
]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  // Real schema states
  pending: "Por confirmar",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  // Legacy mock states
  pending_confirmation: "Por confirmar",
  payment_uploaded: "Verificar pago",
  paid: "Pagado",
  preparing: "Preparando",
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodType, string> = {
  transfermovil: "Transfermóvil",
  cash_on_delivery: "Efectivo a la entrega",
  zelle: "Zelle",
  paypal: "PayPal",
}

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  whatsapp_web: "Web → WhatsApp",
  whatsapp_direct: "WhatsApp directo",
  manual: "Manual",
}

export function getOrderStatusVariant(
  status: OrderStatus,
): "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" {
  switch (status) {
    case "pending":
    case "pending_confirmation":
    case "payment_uploaded":
      return "warning"
    case "confirmed":
    case "paid":
    case "preparing":
    case "shipped":
      return "info"
    case "delivered":
      return "success"
    case "cancelled":
    case "refunded":
      return "destructive"
    default:
      // Future-proof against new schema states — fall back to neutral
      // instead of crashing.
      return "secondary"
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "ahora mismo"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} d`
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  })
}
