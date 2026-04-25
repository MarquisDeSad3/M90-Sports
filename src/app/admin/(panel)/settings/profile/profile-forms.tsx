"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  KeyRound,
  Loader2,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  changeOwnPasswordAction,
  updateProfileAction,
  type ActionState,
} from "./actions"

const initialState: ActionState = { ok: false, message: "" }

interface InitialProfile {
  name: string
  email: string
  photoUrl: string | null
  role: string
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function ProfileForms({ initial }: { initial: InitialProfile }) {
  return (
    <div className="grid gap-5 md:grid-cols-5">
      <div className="md:col-span-3">
        <ProfileCard initial={initial} />
      </div>
      <div className="md:col-span-2">
        <PasswordCard />
      </div>
    </div>
  )
}

function ProfileCard({ initial }: { initial: InitialProfile }) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initialState,
  )
  // Mirrors the saved photo URL. Updated as the admin uploads or removes
  // the photo so the avatar preview reflects pending changes before saving.
  const [photoUrl, setPhotoUrl] = React.useState(initial.photoUrl ?? "")
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      })
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "No se pudo subir la imagen.")
      }
      setPhotoUrl(data.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error subiendo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserIcon className="size-4 text-muted-foreground" />
          Perfil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt={initial.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                {getInitials(initial.name) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                  e.target.value = ""
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading ? "Subiendo…" : photoUrl ? "Cambiar foto" : "Subir foto"}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={uploading}
                    onClick={() => setPhotoUrl("")}
                    className="gap-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                  >
                    <Trash2 className="size-3.5" /> Quitar
                  </Button>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {initial.email} · {initial.role}
              </span>
              {uploadError && (
                <span className="text-xs text-rose-600">{uploadError}</span>
              )}
            </div>
          </div>

          <Field label="Nombre">
            <Input
              name="name"
              defaultValue={initial.name}
              required
              maxLength={120}
              placeholder="Ever"
            />
          </Field>

          {/* Hidden field carries the resolved photoUrl into the FormData
              so the server action sees whatever the upload set. */}
          <input type="hidden" name="photoUrl" value={photoUrl} />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Guardar perfil
            </Button>
            {state.form === "profile" && state.message && (
              <span
                className={`text-sm ${
                  state.ok ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {state.message}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordCard() {
  const [state, action, pending] = useActionState(
    changeOwnPasswordAction,
    initialState,
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-muted-foreground" />
          Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Contraseña actual">
            <Input
              name="current"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nueva contraseña" hint="Mínimo 10 caracteres">
            <Input
              name="next"
              type="password"
              required
              minLength={10}
              maxLength={120}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar nueva">
            <Input
              name="confirm"
              type="password"
              required
              minLength={10}
              maxLength={120}
              autoComplete="new-password"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Cambiar contraseña
            </Button>
            {state.form === "password" && state.message && (
              <span
                className={`text-sm ${
                  state.ok ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {state.message}
              </span>
            )}
            {state.form === "password" && state.ok && (
              <p className="text-xs text-muted-foreground">
                Cerramos todas tus sesiones — entra de nuevo con la
                contraseña nueva.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}
