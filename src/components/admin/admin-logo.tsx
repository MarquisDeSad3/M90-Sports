import { cn } from "@/lib/utils"

export function AdminLogo({
  className,
  collapsed = false,
}: {
  className?: string
  collapsed?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#011b53] via-[#0a2a75] to-[#980e21] text-[10px] font-black tracking-tighter text-cream shadow-md ring-1 ring-white/10">
        <span className="font-display italic text-[12px] leading-none text-[#efd9a3] -translate-y-px">
          M90
        </span>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight">M90 Sports</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admin
          </span>
        </div>
      )}
    </div>
  )
}
