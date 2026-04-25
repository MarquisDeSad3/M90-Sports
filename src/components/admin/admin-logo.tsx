import { cn } from "@/lib/utils"

export function AdminLogo({
  className,
  collapsed = false,
}: {
  className?: string
  collapsed?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#011b53] via-[#0a2a75] to-[#980e21] shadow-md ring-1 ring-black/5">
        <span className="font-display text-[13px] italic leading-none text-[#efd9a3] -translate-y-px tracking-tighter">
          M90
        </span>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            M90 Sports
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Admin Studio
          </span>
        </div>
      )}
    </div>
  )
}
