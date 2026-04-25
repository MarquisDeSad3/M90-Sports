import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminTopbar } from "@/components/admin/topbar"
import { BottomNav } from "@/components/admin/bottom-nav"

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getCurrentAdmin()
  if (!auth) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={auth.admin} />
        <main className="flex-1 pb-20 lg:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
