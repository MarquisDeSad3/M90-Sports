import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

const familiarPro = localFont({
  src: "../../public/familiar-pro-bold.otf",
  display: "swap",
  weight: "700",
  style: "normal",
  variable: "--font-familiar-pro",
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://m90-sports.com"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "M90 Sports — Jerseys de fútbol y NBA en Cuba",
    template: "%s · M90 Sports",
  },
  description:
    "Camisetas oficiales, retro y selecciones. Envíos a toda Cuba — La Habana, Matanzas, Pinar, Mayabeque y Artemisa. Pago Transfermóvil, Zelle, PayPal o efectivo a la entrega.",
  applicationName: "M90 Sports",
  keywords: [
    "jerseys Cuba",
    "camisetas fútbol Cuba",
    "tienda deportiva La Habana",
    "NBA Cuba",
    "retro fútbol",
    "Transfermóvil",
  ],
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/m90-red.png`,
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "M90 Sports — Jerseys en Cuba",
    description:
      "La tienda deportiva en Cuba. Camisetas, equipación y accesorios — pedidos por WhatsApp.",
    type: "website",
    locale: "es_CU",
    siteName: "M90 Sports",
    url: SITE_URL,
    images: [
      {
        url: "/brand/m90-red.png",
        alt: "M90 Sports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "M90 Sports — Jerseys en Cuba",
    description:
      "Camisetas oficiales, retro y selecciones. Envíos a toda Cuba.",
    images: ["/brand/m90-red.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#FAF6EC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${familiarPro.variable} ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
