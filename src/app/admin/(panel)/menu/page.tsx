import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { adminNav } from "@/lib/admin-nav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MobileMenuPage() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Menú</h2>
        <p className="text-sm text-muted-foreground">
          Todas las secciones del panel
        </p>
      </div>

      {adminNav.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <div className="px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {group.label}
          </div>
          <Card className="gap-0 overflow-hidden p-0">
            <ul className="divide-y">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-accent"
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <Icon className="size-4 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {item.title}
                          </span>
                          {item.badge !== undefined && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  )
}
