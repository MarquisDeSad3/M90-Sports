/**
 * Mock data layer — used while we don't have the database yet.
 * Once the VPS + PostgreSQL are live, replace these arrays with Drizzle queries.
 */

export type ProductStatus = "published" | "draft" | "archived"
export type League = "NBA" | "NFL" | "MLB" | "FUTBOL" | "OTRO"
export type VersionType =
  | "home"
  | "away"
  | "alternate"
  | "retro"
  | "city"
  | "all_star"
  | "throwback"

export type Size =
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "KIDS_S"
  | "KIDS_M"
  | "KIDS_L"
  | "KIDS_XL"

export interface MockVariant {
  id: string
  size: Size
  stock: number
  sku: string
  price?: number
}

export interface MockProduct {
  id: string
  slug: string
  name: string
  team: string
  player?: string
  number?: string
  season?: string
  league: League
  versionType: VersionType
  status: ProductStatus
  basePrice: number
  compareAtPrice?: number
  costPerItem?: number
  description: string
  primaryImage: string
  imageCount: number
  variants: MockVariant[]
  categories: string[]
  tags: string[]
  featured: boolean
  isPreorder: boolean
  preorderReleaseDate?: string
  createdAt: string
  updatedAt: string
  unitsSold30d: number
  revenueThisMonth: number
}

export interface MockCategory {
  id: string
  slug: string
  name: string
  parentId: string | null
  productCount: number
}

const stock = (...counts: number[]): MockVariant[] =>
  (["S", "M", "L", "XL", "XXL"] as Size[]).slice(0, counts.length).map(
    (size, i) => ({
      id: `var_${Math.random().toString(36).slice(2, 9)}`,
      size,
      stock: counts[i],
      sku: `M90-${size}`,
    })
  )

export const mockCategories: MockCategory[] = [
  { id: "cat_nba", slug: "nba", name: "NBA", parentId: null, productCount: 8 },
  {
    id: "cat_nba_lakers",
    slug: "lakers",
    name: "Lakers",
    parentId: "cat_nba",
    productCount: 2,
  },
  {
    id: "cat_nba_bulls",
    slug: "bulls",
    name: "Bulls",
    parentId: "cat_nba",
    productCount: 1,
  },
  {
    id: "cat_futbol",
    slug: "futbol",
    name: "Fútbol",
    parentId: null,
    productCount: 7,
  },
  {
    id: "cat_real",
    slug: "real-madrid",
    name: "Real Madrid",
    parentId: "cat_futbol",
    productCount: 2,
  },
  {
    id: "cat_barca",
    slug: "barcelona",
    name: "Barcelona",
    parentId: "cat_futbol",
    productCount: 1,
  },
  {
    id: "cat_retro",
    slug: "retro",
    name: "Retro",
    parentId: null,
    productCount: 5,
  },
  {
    id: "cat_kids",
    slug: "ninos",
    name: "Niños",
    parentId: null,
    productCount: 2,
  },
]

export const mockProducts: MockProduct[] = [
  {
    id: "prod_lakers_bryant_9697",
    slug: "lakers-bryant-1996-97",
    name: "Jersey Lakers Kobe Bryant 1996-97",
    team: "Los Angeles Lakers",
    player: "Kobe Bryant",
    number: "8",
    season: "1996-97",
    league: "NBA",
    versionType: "retro",
    status: "published",
    basePrice: 65,
    compareAtPrice: 80,
    costPerItem: 28,
    description:
      "Jersey retro de Kobe Bryant en su temporada de novato. Mitchell & Ness — calidad de archivo.",
    primaryImage: "/placeholders/lakers-bryant.jpg",
    imageCount: 4,
    variants: stock(3, 8, 12, 6, 2),
    categories: ["NBA", "Lakers", "Retro"],
    tags: ["Bryant", "Lakers", "All-Star", "Mitchell & Ness"],
    featured: true,
    isPreorder: false,
    createdAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-04-22T14:30:00Z",
    unitsSold30d: 24,
    revenueThisMonth: 1560,
  },
  {
    id: "prod_bulls_jordan_9596",
    slug: "bulls-jordan-1995-96",
    name: "Jersey Bulls Michael Jordan 1995-96",
    team: "Chicago Bulls",
    player: "Michael Jordan",
    number: "23",
    season: "1995-96",
    league: "NBA",
    versionType: "retro",
    status: "published",
    basePrice: 65,
    costPerItem: 28,
    description:
      "El icónico jersey rojo de los 72 victorias. La temporada de oro de Jordan.",
    primaryImage: "/placeholders/bulls-jordan.jpg",
    imageCount: 5,
    variants: stock(2, 5, 10, 8, 3),
    categories: ["NBA", "Bulls", "Retro"],
    tags: ["Jordan", "Bulls", "GOAT", "1996"],
    featured: true,
    isPreorder: false,
    createdAt: "2026-02-20T08:00:00Z",
    updatedAt: "2026-04-23T09:15:00Z",
    unitsSold30d: 19,
    revenueThisMonth: 1235,
  },
  {
    id: "prod_heat_lebron_2014",
    slug: "heat-lebron-2014",
    name: "Jersey Heat LeBron James 2014",
    team: "Miami Heat",
    player: "LeBron James",
    number: "6",
    season: "2013-14",
    league: "NBA",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 26,
    description:
      "Jersey blanco del último año de LeBron en Miami. Final 2014 contra Spurs.",
    primaryImage: "/placeholders/heat-lebron.jpg",
    imageCount: 3,
    variants: stock(1, 4, 7, 5, 2),
    categories: ["NBA", "Retro"],
    tags: ["LeBron", "Heat", "Finals"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-02-28T12:00:00Z",
    updatedAt: "2026-04-20T16:00:00Z",
    unitsSold30d: 14,
    revenueThisMonth: 910,
  },
  {
    id: "prod_real_madrid_2024",
    slug: "real-madrid-2024-home",
    name: "Real Madrid 2024 Home",
    team: "Real Madrid",
    season: "2024-25",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 24,
    description:
      "Camiseta titular Real Madrid temporada 2024-25. Personalizable con dorsal.",
    primaryImage: "/placeholders/real-madrid.jpg",
    imageCount: 6,
    variants: stock(2, 6, 11, 9, 4),
    categories: ["Fútbol", "Real Madrid"],
    tags: ["Real Madrid", "La Liga", "2024"],
    featured: true,
    isPreorder: false,
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-04-24T11:00:00Z",
    unitsSold30d: 11,
    revenueThisMonth: 715,
  },
  {
    id: "prod_real_madrid_bellingham",
    slug: "real-madrid-bellingham-2024",
    name: "Real Madrid Bellingham #5 2024",
    team: "Real Madrid",
    player: "Jude Bellingham",
    number: "5",
    season: "2024-25",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 75,
    costPerItem: 28,
    description:
      "Camiseta personalizada de Bellingham con su dorsal #5 estampado.",
    primaryImage: "/placeholders/real-bellingham.jpg",
    imageCount: 4,
    variants: stock(0, 3, 6, 4, 1),
    categories: ["Fútbol", "Real Madrid"],
    tags: ["Bellingham", "Real Madrid", "La Liga"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-01-22T10:00:00Z",
    updatedAt: "2026-04-15T08:00:00Z",
    unitsSold30d: 8,
    revenueThisMonth: 600,
  },
  {
    id: "prod_barca_2024",
    slug: "barcelona-2024-home",
    name: "FC Barcelona 2024 Home",
    team: "FC Barcelona",
    season: "2024-25",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 24,
    description: "Camiseta titular Barcelona temporada 2024-25.",
    primaryImage: "/placeholders/barca.jpg",
    imageCount: 4,
    variants: stock(2, 5, 8, 6, 2),
    categories: ["Fútbol", "Barcelona"],
    tags: ["Barcelona", "La Liga"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-04-19T10:00:00Z",
    unitsSold30d: 7,
    revenueThisMonth: 455,
  },
  {
    id: "prod_warriors_curry_city",
    slug: "warriors-curry-city-2024",
    name: "Warriors Stephen Curry City Edition 2024",
    team: "Golden State Warriors",
    player: "Stephen Curry",
    number: "30",
    season: "2023-24",
    league: "NBA",
    versionType: "city",
    status: "published",
    basePrice: 70,
    costPerItem: 26,
    description: "City Edition con diseño puente Golden Gate.",
    primaryImage: "/placeholders/warriors-curry.jpg",
    imageCount: 3,
    variants: stock(1, 3, 5, 4, 1),
    categories: ["NBA"],
    tags: ["Curry", "Warriors", "City Edition"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-03-01T14:00:00Z",
    updatedAt: "2026-04-18T09:00:00Z",
    unitsSold30d: 6,
    revenueThisMonth: 420,
  },
  {
    id: "prod_argentina_messi_2022",
    slug: "argentina-messi-mundial-2022",
    name: "Argentina Messi Mundial 2022 (3 estrellas)",
    team: "Argentina",
    player: "Lionel Messi",
    number: "10",
    season: "2022",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 80,
    compareAtPrice: 95,
    costPerItem: 32,
    description:
      "Camiseta de Argentina con las 3 estrellas — Mundial Qatar 2022. Edición especial.",
    primaryImage: "/placeholders/argentina-messi.jpg",
    imageCount: 5,
    variants: stock(0, 2, 5, 4, 1),
    categories: ["Fútbol"],
    tags: ["Messi", "Argentina", "Mundial 2022"],
    featured: true,
    isPreorder: false,
    createdAt: "2026-02-10T11:00:00Z",
    updatedAt: "2026-04-20T14:00:00Z",
    unitsSold30d: 10,
    revenueThisMonth: 800,
  },
  {
    id: "prod_psg_mbappe_2023",
    slug: "psg-mbappe-2023",
    name: "PSG Kylian Mbappé 2022-23",
    team: "Paris Saint-Germain",
    player: "Kylian Mbappé",
    number: "7",
    season: "2022-23",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 26,
    description: "Camiseta de PSG con dorsal #7 de Mbappé.",
    primaryImage: "/placeholders/psg-mbappe.jpg",
    imageCount: 3,
    variants: stock(1, 4, 7, 5, 2),
    categories: ["Fútbol"],
    tags: ["Mbappé", "PSG", "Ligue 1"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-01-30T08:00:00Z",
    updatedAt: "2026-04-12T10:00:00Z",
    unitsSold30d: 5,
    revenueThisMonth: 325,
  },
  {
    id: "prod_celtics_tatum_2024",
    slug: "celtics-tatum-2024",
    name: "Celtics Jayson Tatum 2024",
    team: "Boston Celtics",
    player: "Jayson Tatum",
    number: "0",
    season: "2023-24",
    league: "NBA",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 25,
    description: "Verde Celtics, championship season.",
    primaryImage: "/placeholders/celtics-tatum.jpg",
    imageCount: 3,
    variants: stock(2, 3, 6, 4, 1),
    categories: ["NBA"],
    tags: ["Tatum", "Celtics", "Champions"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-03-15T09:00:00Z",
    updatedAt: "2026-04-14T11:00:00Z",
    unitsSold30d: 7,
    revenueThisMonth: 455,
  },
  {
    id: "prod_brazil_pele_retro",
    slug: "brazil-pele-retro-1970",
    name: "Brasil Pelé 1970 Retro",
    team: "Brasil",
    player: "Pelé",
    number: "10",
    season: "1970",
    league: "FUTBOL",
    versionType: "retro",
    status: "published",
    basePrice: 70,
    costPerItem: 28,
    description: "El amarillo más icónico del fútbol — Pelé Mundial México 70.",
    primaryImage: "/placeholders/brazil-pele.jpg",
    imageCount: 4,
    variants: stock(1, 3, 5, 3, 1),
    categories: ["Fútbol", "Retro"],
    tags: ["Pelé", "Brasil", "Mundial"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-02-25T10:00:00Z",
    updatedAt: "2026-04-08T12:00:00Z",
    unitsSold30d: 4,
    revenueThisMonth: 280,
  },
  {
    id: "prod_nuggets_jokic_2024",
    slug: "nuggets-jokic-2024",
    name: "Nuggets Nikola Jokić 2023-24",
    team: "Denver Nuggets",
    player: "Nikola Jokić",
    number: "15",
    season: "2023-24",
    league: "NBA",
    versionType: "home",
    status: "published",
    basePrice: 65,
    costPerItem: 25,
    description: "Jersey blanco de los Nuggets, MVP edition.",
    primaryImage: "/placeholders/nuggets-jokic.jpg",
    imageCount: 3,
    variants: stock(1, 2, 4, 3, 1),
    categories: ["NBA"],
    tags: ["Jokic", "Nuggets", "MVP"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-03-20T11:00:00Z",
    updatedAt: "2026-04-17T13:00:00Z",
    unitsSold30d: 3,
    revenueThisMonth: 195,
  },
  {
    id: "prod_lakers_kobe_kids",
    slug: "lakers-bryant-kids",
    name: "Lakers Bryant — Talla niños",
    team: "Los Angeles Lakers",
    player: "Kobe Bryant",
    number: "24",
    season: "2008-09",
    league: "NBA",
    versionType: "home",
    status: "published",
    basePrice: 45,
    costPerItem: 18,
    description: "Versión para niños del Bryant #24, talla S/M/L niño.",
    primaryImage: "/placeholders/lakers-kids.jpg",
    imageCount: 2,
    variants: [
      {
        id: "var_kids_s",
        size: "KIDS_S",
        stock: 4,
        sku: "M90-LAK-KOBE-KS",
      },
      {
        id: "var_kids_m",
        size: "KIDS_M",
        stock: 6,
        sku: "M90-LAK-KOBE-KM",
      },
      {
        id: "var_kids_l",
        size: "KIDS_L",
        stock: 3,
        sku: "M90-LAK-KOBE-KL",
      },
    ],
    categories: ["NBA", "Niños"],
    tags: ["Bryant", "Lakers", "Niños"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-04-19T14:00:00Z",
    unitsSold30d: 5,
    revenueThisMonth: 225,
  },
  {
    id: "prod_argentina_messi_kids",
    slug: "argentina-messi-kids",
    name: "Argentina Messi — Talla niños",
    team: "Argentina",
    player: "Lionel Messi",
    number: "10",
    season: "2022",
    league: "FUTBOL",
    versionType: "home",
    status: "published",
    basePrice: 50,
    costPerItem: 20,
    description: "Versión niños de la Argentina campeona del mundo.",
    primaryImage: "/placeholders/argentina-kids.jpg",
    imageCount: 2,
    variants: [
      {
        id: "var_arg_kids_s",
        size: "KIDS_S",
        stock: 3,
        sku: "M90-ARG-MESSI-KS",
      },
      {
        id: "var_arg_kids_m",
        size: "KIDS_M",
        stock: 5,
        sku: "M90-ARG-MESSI-KM",
      },
      {
        id: "var_arg_kids_l",
        size: "KIDS_L",
        stock: 2,
        sku: "M90-ARG-MESSI-KL",
      },
    ],
    categories: ["Fútbol", "Niños"],
    tags: ["Messi", "Argentina", "Niños"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-03-08T12:00:00Z",
    updatedAt: "2026-04-21T15:00:00Z",
    unitsSold30d: 4,
    revenueThisMonth: 200,
  },
  {
    id: "prod_warriors_curry_2025",
    slug: "warriors-curry-2025-preorder",
    name: "Warriors Curry 2025 (Pre-orden)",
    team: "Golden State Warriors",
    player: "Stephen Curry",
    number: "30",
    season: "2024-25",
    league: "NBA",
    versionType: "home",
    status: "published",
    basePrice: 70,
    costPerItem: 26,
    description:
      "Pre-orden de la nueva temporada de Curry. Llega en mayo.",
    primaryImage: "/placeholders/warriors-2025.jpg",
    imageCount: 1,
    variants: stock(0, 0, 0, 0, 0),
    categories: ["NBA"],
    tags: ["Curry", "Warriors", "Pre-order"],
    featured: false,
    isPreorder: true,
    preorderReleaseDate: "2026-05-15",
    createdAt: "2026-04-10T08:00:00Z",
    updatedAt: "2026-04-25T10:00:00Z",
    unitsSold30d: 8,
    revenueThisMonth: 560,
  },
  {
    id: "prod_bulls_jordan_blackout_draft",
    slug: "bulls-jordan-blackout",
    name: "Bulls Jordan Blackout Edition",
    team: "Chicago Bulls",
    player: "Michael Jordan",
    number: "23",
    season: "1997-98",
    league: "NBA",
    versionType: "alternate",
    status: "draft",
    basePrice: 75,
    costPerItem: 30,
    description:
      "Edición especial blackout. En proceso de catalogación, sin publicar todavía.",
    primaryImage: "/placeholders/bulls-blackout.jpg",
    imageCount: 1,
    variants: stock(0, 2, 3, 2, 1),
    categories: ["NBA", "Retro"],
    tags: ["Jordan", "Special Edition"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-04-22T10:00:00Z",
    updatedAt: "2026-04-25T08:00:00Z",
    unitsSold30d: 0,
    revenueThisMonth: 0,
  },
  {
    id: "prod_celtics_pierce_archived",
    slug: "celtics-pierce-2008",
    name: "Celtics Paul Pierce 2007-08",
    team: "Boston Celtics",
    player: "Paul Pierce",
    number: "34",
    season: "2007-08",
    league: "NBA",
    versionType: "retro",
    status: "archived",
    basePrice: 60,
    costPerItem: 25,
    description: "Pierce championship year. Sin stock, archivado.",
    primaryImage: "/placeholders/celtics-pierce.jpg",
    imageCount: 2,
    variants: stock(0, 0, 0, 0, 0),
    categories: ["NBA", "Retro"],
    tags: ["Pierce", "Celtics", "Retro"],
    featured: false,
    isPreorder: false,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-03-10T10:00:00Z",
    unitsSold30d: 0,
    revenueThisMonth: 0,
  },
]

// Helpers
export function getProductTotalStock(product: MockProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0)
}

export function getProductLowStock(product: MockProduct): boolean {
  const total = getProductTotalStock(product)
  return total > 0 && total < 5
}

export function getProductOutOfStock(product: MockProduct): boolean {
  return getProductTotalStock(product) === 0
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  published: "Publicado",
  draft: "Borrador",
  archived: "Archivado",
}

export const LEAGUE_LABEL: Record<League, string> = {
  NBA: "NBA",
  NFL: "NFL",
  MLB: "MLB",
  FUTBOL: "Fútbol",
  OTRO: "Otro",
}

export const VERSION_LABEL: Record<VersionType, string> = {
  home: "Local",
  away: "Visitante",
  alternate: "Alternativa",
  retro: "Retro",
  city: "City Edition",
  all_star: "All-Star",
  throwback: "Throwback",
}
