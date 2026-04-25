import { cn } from "@/lib/utils"

const TEAM_COLORS: Record<
  string,
  { from: string; to: string; text: string; mono?: string }
> = {
  "Los Angeles Lakers": { from: "#552583", to: "#FDB927", text: "LAL" },
  "Chicago Bulls": { from: "#CE1141", to: "#000000", text: "CHI" },
  "Miami Heat": { from: "#98002E", to: "#F9A01B", text: "MIA" },
  "Golden State Warriors": { from: "#1D428A", to: "#FFC72C", text: "GSW" },
  "Boston Celtics": { from: "#007A33", to: "#BA9653", text: "BOS" },
  "Denver Nuggets": { from: "#0E2240", to: "#FEC524", text: "DEN" },
  "Real Madrid": { from: "#FFFFFF", to: "#E8E8E8", text: "RMA" },
  "FC Barcelona": { from: "#A50044", to: "#004D98", text: "FCB" },
  "Paris Saint-Germain": { from: "#004170", to: "#DA291C", text: "PSG" },
  Argentina: { from: "#75AADB", to: "#FFFFFF", text: "ARG" },
  Brasil: { from: "#FFD400", to: "#009C3B", text: "BRA" },
}

function getColors(team: string) {
  return (
    TEAM_COLORS[team] ?? {
      from: "#011b53",
      to: "#980e21",
      text: team
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
    }
  )
}

interface ProductImageProps {
  team: string
  number?: string
  className?: string
  size?: "sm" | "md" | "lg"
  /**
   * If provided, renders the real product photo. Falls back to the
   * team-colored initials if absent or if the image fails to load.
   */
  imageUrl?: string | null
}

export function ProductImage({
  team,
  number,
  className,
  size = "md",
  imageUrl,
}: ProductImageProps) {
  const colors = getColors(team)
  const dim = {
    sm: { container: "size-9", text: "text-[9px]", num: "text-sm" },
    md: { container: "size-12", text: "text-[10px]", num: "text-base" },
    lg: { container: "size-16", text: "text-xs", num: "text-xl" },
  }[size]

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-inset ring-black/5",
          dim.container,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={team || "Producto"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-black/5",
        dim.container,
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
      }}
    >
      {/* Subtle stripe — jersey vibe */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />

      <div className="relative grid h-full w-full place-items-center">
        {number ? (
          <div className="flex flex-col items-center leading-none">
            <span
              className={cn(
                "font-display font-bold text-white drop-shadow-sm",
                dim.num
              )}
            >
              {number}
            </span>
            <span
              className={cn(
                "mt-0.5 font-mono font-semibold uppercase tracking-wider text-white/80",
                dim.text
              )}
            >
              {colors.text}
            </span>
          </div>
        ) : (
          <span
            className={cn(
              "font-display font-bold text-white drop-shadow-sm",
              dim.num
            )}
          >
            {colors.text}
          </span>
        )}
      </div>
    </div>
  )
}
