import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PageStubProps {
  title: string
  description: string
  /** Kept for API compatibility — current design ignores it. */
  icon?: LucideIcon
  /** Same — todo lists were noisy, removed from the visual. */
  todo?: string[]
}

/**
 * Simple "this page is being built" placeholder. Animated construction
 * SVG (saw bouncing on a plank) — no feature list, no DB-readiness copy.
 * The list was distracting; visitors don't need a checklist of unbuilt
 * features, only confirmation that we know it's missing.
 */
export function PageStub({ title, description }: PageStubProps) {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </h2>
          <Badge variant="warning" className="text-[10px]">
            Próximamente
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative flex min-h-[360px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <ConstructionSvg />

        <div className="relative flex max-w-md flex-col gap-1">
          <h3 className="text-base font-semibold">Construyendo</h3>
          <p className="text-sm text-muted-foreground">
            Esta sección está en obra.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline animated SVG: hard hat that bobs, with sparkles around it.
 * Pure CSS keyframes via Tailwind's animate-* utilities so we don't
 * pull in motion just for this.
 */
function ConstructionSvg() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="96"
      height="96"
      role="img"
      aria-label="Sección en construcción"
      className="text-muted-foreground"
    >
      {/* Floor line */}
      <line
        x1="20"
        y1="100"
        x2="100"
        y2="100"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Hard hat group, bobs up and down */}
      <g className="animate-[bob_2.4s_ease-in-out_infinite]">
        {/* Hat brim */}
        <path
          d="M28 78 H92 L88 86 H32 Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
        {/* Hat body */}
        <path
          d="M40 78 C40 60, 50 50, 60 50 C70 50, 80 60, 80 78 Z"
          fill="currentColor"
          fillOpacity="0.35"
        />
        {/* Stripe */}
        <rect
          x="58"
          y="50"
          width="4"
          height="28"
          fill="currentColor"
          fillOpacity="0.5"
        />
      </g>
      {/* Sparkles */}
      <g className="animate-[twinkle_1.8s_ease-in-out_infinite]" opacity="0.6">
        <circle cx="22" cy="42" r="2" fill="currentColor" />
        <circle cx="98" cy="56" r="1.5" fill="currentColor" />
        <circle cx="32" cy="22" r="1.5" fill="currentColor" />
        <circle cx="92" cy="32" r="2" fill="currentColor" />
      </g>
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </svg>
  )
}
