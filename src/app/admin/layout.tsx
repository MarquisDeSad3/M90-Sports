import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "M90 Sports · Admin",
  description: "Panel de administración M90 Sports",
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="m90-admin-theme"
    >
      <div className="admin-scope min-h-svh bg-background text-foreground antialiased">
        {children}
      </div>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  )
}
