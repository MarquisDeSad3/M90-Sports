"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, BellOff, LogOut, Search, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNav } from "@/lib/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/app/admin/login/actions"
import { ModeToggle } from "./mode-toggle"
import { MobileDrawer } from "./mobile-drawer"

function findCurrentTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard"
  for (const group of adminNav) {
    for (const item of group.items) {
      if (item.href === pathname) return item.title
      if (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
        return item.title
    }
  }
  return "Admin"
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
  viewer: "Viewer",
}

interface AdminTopbarProps {
  admin: {
    id: string
    email: string
    name: string
    photoUrl?: string | null
    role: "owner" | "manager" | "staff" | "viewer"
  }
}

export function AdminTopbar({ admin }: AdminTopbarProps) {
  const pathname = usePathname()
  const title = findCurrentTitle(pathname)
  const initials = getInitials(admin.name)
  const roleLabel = ROLE_LABEL[admin.role] ?? admin.role

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md md:gap-4 md:px-6">
      <MobileDrawer />

      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos, pedidos..."
            className="h-9 w-[260px] pl-9 lg:w-[320px]"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">
            ⌘K
          </kbd>
        </div>

        {/* Search — mobile (icon only) */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 md:hidden"
          aria-label="Buscar"
        >
          <Search className="size-4" />
        </Button>

        {/* Notifications — empty until the notifications pipeline is wired
           to real DB events. Until then we show an honest empty state plus
           a single demo entry so the dropdown isn't blank. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9"
              aria-label="Notificaciones"
            >
              <Bell className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] p-0">
            <DropdownMenuLabel className="flex items-center justify-between border-b px-4 py-3">
              <span>Notificaciones</span>
              <Badge variant="secondary" className="text-[10px]">
                Sin novedades
              </Badge>
            </DropdownMenuLabel>
            <div className="max-h-[320px] overflow-y-auto">
              <div className="border-b px-4 py-2.5">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                    Demo
                  </Badge>
                  <span className="text-sm font-medium">Notificación de prueba</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Así se verán los avisos cuando llegue un pedido nuevo,
                  un pago por verificar o una alerta de stock bajo.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <BellOff className="size-6 text-muted-foreground/60" />
                <p className="text-sm font-medium">Aquí te llegarán los avisos</p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  Pedidos nuevos, pagos por verificar y alertas de stock se
                  mostrarán en este panel.
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5 md:px-2"
              aria-label="Perfil"
            >
              <Avatar className="size-7">
                {admin.photoUrl ? (
                  <AvatarImage src={admin.photoUrl} alt={admin.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                {admin.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold">{admin.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {admin.email}
              </span>
              <Badge
                variant="outline"
                className="mt-1.5 w-fit border-primary/30 text-[10px]"
              >
                {roleLabel}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings/profile">
                <User className="size-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="size-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button
                type="submit"
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-hidden transition-colors hover:bg-destructive/10 focus:bg-destructive/10 [&_svg]:pointer-events-none [&_svg]:size-4"
              >
                <LogOut />
                Cerrar sesión
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
