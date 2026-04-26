import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Star,
  Wallet,
  Sparkles,
  Truck,
  Ticket,
  Settings,
  ShieldUser,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
  description?: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const adminNav: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Resumen del negocio",
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      {
        title: "Productos",
        href: "/admin/products",
        icon: Package,
        description: "Jerseys, gorras, conjuntos...",
      },
      {
        title: "Categorías",
        href: "/admin/categories",
        icon: Tag,
        description: "Colecciones y secciones",
      },
      {
        title: "Por encargo",
        href: "/admin/preorders",
        icon: Sparkles,
        description: "Productos que pedimos al proveedor",
      },
    ],
  },
  {
    label: "Ventas",
    items: [
      {
        title: "Pedidos",
        href: "/admin/orders",
        icon: ShoppingCart,
        badge: 4,
        description: "Pedidos activos",
      },
      {
        title: "Pagos",
        href: "/admin/payments",
        icon: Wallet,
        badge: 2,
        description: "Verificar Transfermóvil / Zelle",
      },
      {
        title: "Pedidos a medida",
        href: "/admin/custom-requests",
        icon: Sparkles,
        description: "Solicitudes especiales",
      },
      {
        title: "Cupones",
        href: "/admin/coupons",
        icon: Ticket,
        description: "Descuentos y promos",
      },
    ],
  },
  {
    label: "Comunidad",
    items: [
      {
        title: "Clientes",
        href: "/admin/customers",
        icon: Users,
        description: "Diáspora y Cuba",
      },
      {
        title: "Reseñas",
        href: "/admin/reviews",
        icon: Star,
        badge: 3,
        description: "Aprobar y responder",
      },
    ],
  },
  {
    label: "Logística",
    items: [
      {
        title: "Zonas de envío",
        href: "/admin/shipping",
        icon: Truck,
        description: "Provincias y precios",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Equipo",
        href: "/admin/staff",
        icon: ShieldUser,
        description: "Managers y staff",
      },
      {
        title: "Configuración",
        href: "/admin/settings",
        icon: Settings,
        description: "Pagos, monedas, marca",
      },
    ],
  },
]

// Quick access items for the mobile bottom nav (5 max for thumb reach)
export const mobileNav: NavItem[] = [
  { title: "Inicio", href: "/admin", icon: LayoutDashboard },
  { title: "Productos", href: "/admin/products", icon: Package },
  { title: "Pedidos", href: "/admin/orders", icon: ShoppingCart, badge: 4 },
  { title: "Reseñas", href: "/admin/reviews", icon: Star, badge: 3 },
  { title: "Más", href: "/admin/menu", icon: Settings },
]
