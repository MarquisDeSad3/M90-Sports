/**
 * Mock reviews data layer.
 *
 * Notes:
 * - Reviews are immutable for admins (no editing). Only customer can edit
 *   their own. Admin only approves / rejects / features.
 * - "featured" reviews appear on the public landing (max 6).
 * - All other approved reviews appear on /reviews page.
 */

export type ReviewStatus = "pending" | "approved" | "rejected"

export interface MockReview {
  id: string
  productId: string
  productName: string
  team: string
  customerName: string
  customerCity?: string
  customerCountry: string  // CU, US, ES...
  rating: number  // 1-5
  body: string
  hasPhoto: boolean
  photoUrl?: string  // when customer uploaded a photo of the jersey
  status: ReviewStatus
  featured: boolean
  createdAt: string
  approvedAt?: string
  adminResponse?: string
  adminResponseAt?: string
}

const today = new Date("2026-04-25T15:00:00Z")
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const mockReviews: MockReview[] = [
  // ⭐ FEATURED (6) — appear on landing
  {
    id: "rev_001",
    productId: "prod_lakers_bryant_9697",
    productName: "Jersey Lakers Kobe Bryant 1996-97",
    team: "Los Angeles Lakers",
    customerName: "Andrés Lozano",
    customerCity: "La Habana",
    customerCountry: "CU",
    rating: 5,
    body:
      "Llegó en tiempo y la calidad es brutal. La tela y los detalles de los números se ven igual que en las fotos. Mi hijo no se lo quita. Gracias M90, súper recomendados.",
    hasPhoto: true,
    status: "approved",
    featured: true,
    createdAt: daysAgo(5),
    approvedAt: daysAgo(4),
  },
  {
    id: "rev_002",
    productId: "prod_real_madrid_2024",
    productName: "Real Madrid 2024 Home",
    team: "Real Madrid",
    customerName: "Marta García",
    customerCity: "Miami",
    customerCountry: "US",
    rating: 5,
    body:
      "La compré desde Miami para mi sobrino en La Habana. Llegó perfecta en menos de una semana. El proceso por WhatsApp con Ever fue cero estrés. Encontré mi tienda de jerseys.",
    hasPhoto: false,
    status: "approved",
    featured: true,
    createdAt: daysAgo(8),
    approvedAt: daysAgo(7),
  },
  {
    id: "rev_003",
    productId: "prod_argentina_messi_2022",
    productName: "Argentina Messi Mundial 2022 (3 estrellas)",
    team: "Argentina",
    customerName: "Yoel Rodríguez",
    customerCity: "Pinar del Río",
    customerCountry: "CU",
    rating: 5,
    body:
      "Soy fanático del fútbol y esta camiseta me hace acordar al mejor mundial de mi vida. La estampa de Messi se ve impecable. Me costó conseguirla y aquí me llegó sin problema.",
    hasPhoto: true,
    status: "approved",
    featured: true,
    createdAt: daysAgo(11),
    approvedAt: daysAgo(10),
  },
  {
    id: "rev_004",
    productId: "prod_bulls_jordan_9596",
    productName: "Jersey Bulls Michael Jordan 1995-96",
    team: "Chicago Bulls",
    customerName: "Liliana Cruz",
    customerCity: "Madrid",
    customerCountry: "ES",
    rating: 5,
    body:
      "Mi marido es fanático de Jordan, le regalé esta y casi llora. Pago por PayPal sin drama, mensajería entregó en La Habana en 4 días. Estoy segura de volver a comprar.",
    hasPhoto: false,
    status: "approved",
    featured: true,
    createdAt: daysAgo(14),
    approvedAt: daysAgo(13),
  },
  {
    id: "rev_005",
    productId: "prod_warriors_curry_city",
    productName: "Warriors Stephen Curry City Edition 2024",
    team: "Golden State Warriors",
    customerName: "Roberto Pérez",
    customerCity: "La Habana",
    customerCountry: "CU",
    rating: 5,
    body:
      "Con la City Edition arrasé en el barrio. El detalle del puente Golden Gate en la espalda es para enmarcar. Pagué por Zelle, todo limpio en 5 minutos.",
    hasPhoto: true,
    status: "approved",
    featured: true,
    createdAt: daysAgo(18),
    approvedAt: daysAgo(17),
    adminResponse: "Eres el mejor cliente Roberto, esperamos verte de nuevo 🔥",
  },
  {
    id: "rev_006",
    productId: "prod_brazil_pele_retro",
    productName: "Brasil Pelé 1970 Retro",
    team: "Brasil",
    customerName: "Pedro Castro",
    customerCity: "Miramar",
    customerCountry: "CU",
    rating: 5,
    body:
      "Le regalé a mi padre que es de la generación que vio a Pelé en vivo. Le brillaron los ojos cuando la abrió. La tela retro se siente premium. M90 nunca falla.",
    hasPhoto: true,
    status: "approved",
    featured: true,
    createdAt: daysAgo(22),
    approvedAt: daysAgo(21),
  },

  // 🟢 APPROVED — public but not featured
  {
    id: "rev_007",
    productId: "prod_heat_lebron_2014",
    productName: "Jersey Heat LeBron James 2014",
    team: "Miami Heat",
    customerName: "Yandri Suárez",
    customerCity: "Vedado",
    customerCountry: "CU",
    rating: 5,
    body:
      "Tela suave, cómoda incluso para entrenar. El número y nombre quedaron impecables. La caja vino con un sticker de marca, detallazo.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(3),
    approvedAt: daysAgo(2),
  },
  {
    id: "rev_008",
    productId: "prod_celtics_tatum_2024",
    productName: "Celtics Jayson Tatum 2024",
    team: "Boston Celtics",
    customerName: "Mariana López",
    customerCity: "Miami",
    customerCountry: "US",
    rating: 4,
    body:
      "Compré para enviar a mi hermano en Cuba. La calidad es excelente, solo tardó un día más de lo esperado pero comunicación constante por WhatsApp.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(6),
    approvedAt: daysAgo(5),
  },
  {
    id: "rev_009",
    productId: "prod_real_madrid_bellingham",
    productName: "Real Madrid Bellingham #5 2024",
    team: "Real Madrid",
    customerName: "Camila Pérez",
    customerCity: "Matanzas",
    customerCountry: "CU",
    rating: 5,
    body:
      "El estampado del 5 de Bellingham es impresionante. Mi hijo es fan total y la camiseta superó las expectativas.",
    hasPhoto: true,
    status: "approved",
    featured: false,
    createdAt: daysAgo(9),
    approvedAt: daysAgo(8),
  },
  {
    id: "rev_010",
    productId: "prod_psg_mbappe_2023",
    productName: "PSG Kylian Mbappé 2022-23",
    team: "Paris Saint-Germain",
    customerName: "Alejandro Díaz",
    customerCity: "Centro Habana",
    customerCountry: "CU",
    rating: 4,
    body:
      "Buena compra, llegó como esperaba. Pequeño detalle: la talla L queda un pelín ajustada, pediría XL la próxima vez.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(15),
    approvedAt: daysAgo(14),
  },
  {
    id: "rev_011",
    productId: "prod_nuggets_jokic_2024",
    productName: "Nuggets Nikola Jokić 2023-24",
    team: "Denver Nuggets",
    customerName: "Carlos Ramírez",
    customerCity: "La Habana",
    customerCountry: "CU",
    rating: 5,
    body:
      "Jokic MVP y este jersey lo mereces. Llegó en perfecto estado, pago por Zelle sin dramas.",
    hasPhoto: true,
    status: "approved",
    featured: false,
    createdAt: daysAgo(20),
    approvedAt: daysAgo(19),
  },
  {
    id: "rev_012",
    productId: "prod_lakers_kobe_kids",
    productName: "Lakers Bryant — Talla niños",
    team: "Los Angeles Lakers",
    customerName: "Anelis Rodríguez",
    customerCity: "Plaza",
    customerCountry: "CU",
    rating: 5,
    body:
      "Mi sobrino está enamorado de su jersey. La calidad para niños es la misma que adulto, no es plástico barato. 10/10.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(24),
    approvedAt: daysAgo(23),
  },
  {
    id: "rev_013",
    productId: "prod_argentina_messi_kids",
    productName: "Argentina Messi — Talla niños",
    team: "Argentina",
    customerName: "Daniela Fernández",
    customerCity: "Cárdenas",
    customerCountry: "CU",
    rating: 5,
    body:
      "Para mis dos hijos. Las dos llegaron juntas, perfectas. Tienen 6 y 9 años y les queda como un guante.",
    hasPhoto: true,
    status: "approved",
    featured: false,
    createdAt: daysAgo(28),
    approvedAt: daysAgo(27),
  },
  {
    id: "rev_014",
    productId: "prod_real_madrid_2024",
    productName: "Real Madrid 2024 Home",
    team: "Real Madrid",
    customerName: "Hassan Méndez",
    customerCity: "Vedado",
    customerCountry: "CU",
    rating: 4,
    body:
      "Camiseta de buena calidad, idéntica a la oficial. El envío demoró un poquito pero el resultado vale la pena.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(32),
    approvedAt: daysAgo(31),
  },
  {
    id: "rev_015",
    productId: "prod_heat_lebron_2014",
    productName: "Jersey Heat LeBron James 2014",
    team: "Miami Heat",
    customerName: "Sofia Martínez",
    customerCity: "Mariel",
    customerCountry: "CU",
    rating: 5,
    body:
      "Para mi novio fanático del Heat. La cara cuando la vio no tuvo precio. Cosida perfecta, talla justa.",
    hasPhoto: false,
    status: "approved",
    featured: false,
    createdAt: daysAgo(35),
    approvedAt: daysAgo(34),
  },

  // 🟡 PENDING — awaiting moderation
  {
    id: "rev_016",
    productId: "prod_bulls_jordan_9596",
    productName: "Jersey Bulls Michael Jordan 1995-96",
    team: "Chicago Bulls",
    customerName: "Eduardo Pérez",
    customerCity: "Bauta",
    customerCountry: "CU",
    rating: 5,
    body:
      "El Jordan de los 72 victorias en mi closet, sueño cumplido. Tela retro, cosido fino. M90 no defrauda.",
    hasPhoto: true,
    status: "pending",
    featured: false,
    createdAt: daysAgo(0),
  },
  {
    id: "rev_017",
    productId: "prod_real_madrid_2024",
    productName: "Real Madrid 2024 Home",
    team: "Real Madrid",
    customerName: "Yanela Hernández",
    customerCity: "10 de Octubre",
    customerCountry: "CU",
    rating: 4,
    body:
      "Buen producto, llegó en una semana. La descripción coincide con lo que recibí. Recomiendo.",
    hasPhoto: false,
    status: "pending",
    featured: false,
    createdAt: daysAgo(1),
  },
  {
    id: "rev_018",
    productId: "prod_warriors_curry_city",
    productName: "Warriors Stephen Curry City Edition 2024",
    team: "Golden State Warriors",
    customerName: "Diego Ortega",
    customerCity: "Habana del Este",
    customerCountry: "CU",
    rating: 5,
    body:
      "Pedido por WhatsApp, atención top. La camiseta es una belleza. Volveré a comprar el mes que viene.",
    hasPhoto: true,
    status: "pending",
    featured: false,
    createdAt: daysAgo(0),
  },

  // 🔴 REJECTED — visible to admin only, never public
  {
    id: "rev_019",
    productId: "prod_lakers_bryant_9697",
    productName: "Jersey Lakers Kobe Bryant 1996-97",
    team: "Los Angeles Lakers",
    customerName: "Anónimo",
    customerCountry: "CU",
    rating: 1,
    body:
      "[texto promocional spam de otra tienda — rechazado]",
    hasPhoto: false,
    status: "rejected",
    featured: false,
    createdAt: daysAgo(7),
  },
]

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
}

export const FEATURED_LIMIT = 6

export function countReviews() {
  return {
    pending: mockReviews.filter((r) => r.status === "pending").length,
    approved: mockReviews.filter((r) => r.status === "approved").length,
    rejected: mockReviews.filter((r) => r.status === "rejected").length,
    featured: mockReviews.filter((r) => r.featured).length,
    total: mockReviews.length,
  }
}

export function avgRating() {
  const approved = mockReviews.filter((r) => r.status === "approved")
  if (approved.length === 0) return 0
  return approved.reduce((s, r) => s + r.rating, 0) / approved.length
}
