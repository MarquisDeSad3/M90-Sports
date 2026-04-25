"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminLogo } from "@/components/admin/admin-logo"
import { loginAction, type LoginState } from "./actions"

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  )
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="admin-scope relative grid min-h-svh place-items-center overflow-hidden bg-background p-4 text-foreground antialiased">
      {/* Animated backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 size-[480px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 size-[480px] rounded-full bg-rose-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo at top */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <AdminLogo />
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 backdrop-blur">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Conexión cifrada
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-2xl backdrop-blur-xl">
          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-[#011b53] via-[#980e21] to-[#efd9a3]" />

          <form action={formAction} className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Acceso al panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Inicia sesión con tu cuenta de M90 Sports
              </p>
            </div>

            {state?.error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span className="text-destructive">{state.error}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                    className="h-11 pl-10"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/admin/recover"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    ¿Olvidaste?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="h-11 px-10"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="group h-11 gap-2 text-sm font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar al panel
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>solo personal autorizado</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Eres cliente?{" "}
          <Link href="/" className="font-medium text-foreground hover:underline">
            Ir a la tienda
          </Link>
        </p>
      </div>
    </div>
  )
}
