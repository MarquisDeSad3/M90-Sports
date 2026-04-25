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

export const metadata: Metadata = {
  title: "M90 — Tienda de artículos deportivos en Cuba",
  description:
    "Camisetas de fútbol oficiales, retro y selecciones. Envíos a toda Cuba. Pagos por Transfermóvil, MLC, CUP y USD.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/m90-red.png`,
  },
  openGraph: {
    title: "M90 — Fútbol, deporte y estilo",
    description:
      "La tienda deportiva de Cuba. Camisetas, equipación y accesorios — pedidos por WhatsApp.",
    type: "website",
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
