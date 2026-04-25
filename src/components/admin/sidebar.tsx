"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { adminNav } from "@/lib/admin-nav"
import { AdminLogo } from "./admin-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed")
    if (saved === "true") setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem("admin-sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-svh shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex lg:flex-col",
          collapsed ? "w-[76px]" : "w-[256px]"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/60 px-4",
            collapsed && "justify-center px-2"
          )}
        >
          <Link
            href="/admin"
            className="flex items-center transition-opacity hover:opacity-90"
          >
            <AdminLogo collapsed={collapsed} />
          </Link>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav
            className={cn(
              "flex flex-col gap-5 py-5",
              collapsed ? "px-2" : "px-3"
            )}
          >
            {adminNav.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                {!collapsed && (
                  <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href))

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                        active
                          ? "bg-card text-foreground shadow-card"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[17px] shrink-0 transition-colors",
                          active
                            ? "text-primary"
                            : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground"
                        )}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge !== undefined && (
                            <Badge
                              variant={active ? "default" : "secondary"}
                              className={cn(
                                "h-[18px] min-w-[18px] justify-center px-1.5 text-[10px] font-semibold tabular-nums",
                                !active && "bg-sidebar-accent/80"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && item.badge !== undefined && (
                        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
                      )}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                          {item.badge !== undefined && ` · ${item.badge}`}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <React.Fragment key={item.href}>{linkContent}</React.Fragment>
                  )
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer / Collapse */}
        <div
          className={cn(
            "border-t border-sidebar-border/60 p-2",
            collapsed && "flex justify-center"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              "h-9 w-full justify-start gap-2 rounded-lg text-xs font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
              collapsed && "size-9 w-9 justify-center px-0"
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
