"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNav } from "@/lib/admin-nav"
import { AdminLogo } from "./admin-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet"

export function MobileDrawer() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Close drawer on route change
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[80vw] max-w-[300px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="border-b border-sidebar-border px-4">
          <SheetTitle className="flex items-center text-left">
            <AdminLogo />
          </SheetTitle>
          <SheetDescription className="sr-only">Menú de administración</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-6 px-3 py-4">
            {adminNav.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/50">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <Icon className="size-[18px] shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge !== undefined && (
                        <Badge
                          variant={active ? "default" : "secondary"}
                          className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
