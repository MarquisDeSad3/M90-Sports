import { cn } from "@/lib/utils"
import type { ProductStatus } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

const map: Record<
  ProductStatus,
  {
    label: string
    variant: "success" | "secondary" | "outline"
    className?: string
  }
> = {
  published: { label: "Publicado", variant: "success" },
  draft: {
    label: "Borrador",
    variant: "outline",
    className: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  },
  archived: {
    label: "Archivado",
    variant: "secondary",
    className: "bg-muted text-muted-foreground",
  },
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const c = map[status]
  return (
    <Badge variant={c.variant} className={cn(c.className)}>
      {c.label}
    </Badge>
  )
}
