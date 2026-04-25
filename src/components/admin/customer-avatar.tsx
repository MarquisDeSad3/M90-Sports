import { cn } from "@/lib/utils"

const PALETTES: { from: string; to: string }[] = [
  { from: "#011b53", to: "#0a2a75" },
  { from: "#980e21", to: "#c31428" },
  { from: "#0E2240", to: "#FEC524" },
  { from: "#1D428A", to: "#FFC72C" },
  { from: "#552583", to: "#FDB927" },
  { from: "#007A33", to: "#BA9653" },
  { from: "#A50044", to: "#004D98" },
  { from: "#024d3f", to: "#0e8b6a" },
  { from: "#3a2e6e", to: "#7a64d4" },
]

function hashName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  return Math.abs(h)
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function CustomerAvatar({
  name,
  size = "md",
  className,
}: {
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}) {
  const palette = PALETTES[hashName(name) % PALETTES.length]
  const initials = initialsOf(name)
  const dim = {
    sm: "size-7 text-[10px]",
    md: "size-9 text-xs",
    lg: "size-12 text-sm",
    xl: "size-16 text-lg",
  }[size]

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white shadow-sm ring-1 ring-black/5",
        dim,
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
      aria-label={name}
    >
      <span className="relative tracking-tight">{initials}</span>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
    </div>
  )
}
