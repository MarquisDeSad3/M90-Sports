import { Construction, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PageStubProps {
  title: string
  description: string
  icon?: LucideIcon
  todo?: string[]
}

export function PageStub({
  title,
  description,
  icon: Icon = Construction,
  todo,
}: PageStubProps) {
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
        {/* Subtle backdrop pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-1 ring-inset ring-border/60">
          <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <div className="relative flex max-w-md flex-col gap-1.5">
          <h3 className="text-base font-semibold">En construcción</h3>
          <p className="text-sm text-muted-foreground">
            Esta sección se va a conectar a la base de datos cuando el VPS esté
            activo. La estructura ya está lista en el esquema.
          </p>
        </div>

        {todo && todo.length > 0 && (
          <div className="relative mt-2 flex w-full max-w-md flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-left">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              En esta página podrás
            </div>
            <ul className="flex flex-col gap-1">
              {todo.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-primary/70" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
