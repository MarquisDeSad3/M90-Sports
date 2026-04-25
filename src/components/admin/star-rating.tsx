import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  rating,
  size = "md",
  showNumber = false,
  className,
}: {
  rating: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  className?: string
}) {
  const sizeClass = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  }[size]

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            sizeClass,
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          )}
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-xs font-semibold tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
