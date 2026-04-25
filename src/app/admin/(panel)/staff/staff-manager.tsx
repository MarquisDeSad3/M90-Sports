"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  Key,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createStaffAction,
  deleteStaffAction,
  resetPasswordAction,
  unlockStaffAction,
  updateStaffAction,
  type ActionResult,
} from "./actions"
import type { StaffMember } from "@/lib/queries/staff"
import type { AdminRole } from "@/lib/auth/roles"

const initialState: ActionResult = { ok: false, error: "" }

const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Dueño",
  manager: "Manager",
  staff: "Staff",
  viewer: "Solo lectura",
}

const ROLE_DESC: Record<AdminRole, string> = {
  owner: "Acceso total · gestión de equipo y configuración",
  manager: "Catálogo + pedidos · sin configuración",
  staff: "Pedidos del día a día · sin tocar productos",
  viewer: "Solo lectura, no puede modificar nada",
}

const ROLE_BADGE: Record<
  AdminRole,
  "default" | "secondary" | "success" | "warning"
> = {
  owner: "warning",
  manager: "success",
  staff: "default",
  viewer: "secondary",
}

interface StaffManagerProps {
  initial: StaffMember[]
  currentAdminId: string
}

export function StaffManager({ initial, currentAdminId }: StaffManagerProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {initial.length} {initial.length === 1 ? "usuario" : "usuarios"} con
          acceso al panel
        </div>
        <Button
          onClick={() => setCreateOpen((v) => !v)}
          variant={createOpen ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          {createOpen ? (
            <>
              <X className="size-4" /> Cancelar
            </>
          ) : (
            <>
              <UserPlus className="size-4" /> Crear nuevo admin
            </>
          )}
        </Button>
      </div>

      {createOpen && <CreateForm onDone={() => setCreateOpen(false)} />}

      <Card>
        <CardContent className="p-0">
          {initial.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay usuarios todavía.
            </p>
          ) : (
            <ul className="divide-y">
              {initial.map((m) => (
                <StaffRow
                  key={m.id}
                  member={m}
                  isExpanded={editingId === m.id}
                  isSelf={m.id === currentAdminId}
                  onToggle={() =>
                    setEditingId((v) => (v === m.id ? null : m.id))
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createStaffAction,
    initialState,
  )
  const [role, setRole] = React.useState<AdminRole>("staff")

  React.useEffect(() => {
    if (state.ok) onDone()
  }, [state.ok, onDone])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo administrador</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              maxLength={120}
              placeholder="juan@m90-sports.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input
              id="password"
              name="password"
              type="text"
              required
              minLength={10}
              maxLength={120}
              placeholder="Mínimo 10 caracteres"
            />
            <span className="text-[11px] text-muted-foreground">
              Compártela en persona o por WhatsApp. El usuario debería cambiarla luego.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["owner", "manager", "staff", "viewer"] as AdminRole[]).map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex flex-col">
                        <span>{ROLE_LABEL[r]}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {ROLE_DESC[r]}
                        </span>
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <input type="hidden" name="role" value={role} />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Crear administrador
            </Button>
            {!state.ok && state.error && (
              <span className="text-sm text-rose-600">{state.error}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function StaffRow({
  member,
  isExpanded,
  isSelf,
  onToggle,
}: {
  member: StaffMember
  isExpanded: boolean
  isSelf: boolean
  onToggle: () => void
}) {
  return (
    <li className="px-4 py-3 transition-colors hover:bg-accent/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {member.name}
            </span>
            {isSelf && (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                tú
              </span>
            )}
            {member.isLocked && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <Lock className="size-3" /> bloqueado
              </Badge>
            )}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {member.email}
            {member.lastLoginAt && (
              <>
                {" · último acceso "}
                {new Date(member.lastLoginAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </>
            )}
          </span>
        </div>
        <Badge variant={ROLE_BADGE[member.role]} className="gap-1">
          <ShieldCheck className="size-3" />
          {ROLE_LABEL[member.role]}
        </Badge>
      </button>

      {isExpanded && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <UpdateForm member={member} />
          <ResetPasswordForm memberId={member.id} />
          <div className="flex flex-wrap items-center gap-2">
            {member.isLocked && <UnlockButton memberId={member.id} />}
            {!isSelf && <DeleteButton memberId={member.id} />}
          </div>
        </div>
      )}
    </li>
  )
}

function UpdateForm({ member }: { member: StaffMember }) {
  const [state, formAction, pending] = useActionState(
    updateStaffAction,
    initialState,
  )
  const [role, setRole] = React.useState<AdminRole>(member.role)

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-3">
      <input type="hidden" name="id" value={member.id} />
      <div className="flex flex-col gap-1">
        <Label className="text-[11px]">Nombre</Label>
        <Input
          name="name"
          defaultValue={member.name}
          required
          maxLength={120}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-[11px]">Rol</Label>
        <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["owner", "manager", "staff", "viewer"] as AdminRole[]).map(
              (r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending} size="sm" className="gap-1.5">
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Guardar
        </Button>
        {state.ok && (
          <span className="text-xs text-emerald-600">Guardado</span>
        )}
        {!state.ok && state.error && (
          <span className="text-xs text-rose-600">{state.error}</span>
        )}
      </div>
    </form>
  )
}

function ResetPasswordForm({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  )
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={memberId} />
      <div className="flex flex-1 min-w-[180px] flex-col gap-1">
        <Label className="text-[11px]">Nueva contraseña</Label>
        <Input
          name="password"
          type="text"
          required
          minLength={10}
          maxLength={120}
          placeholder="Mínimo 10 caracteres"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Key className="size-3.5" />
        )}
        Cambiar contraseña
      </Button>
      {state.ok && (
        <span className="text-xs text-emerald-600">
          Listo. Comparte la nueva contraseña con el usuario.
        </span>
      )}
      {!state.ok && state.error && (
        <span className="text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  )
}

function UnlockButton({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState(
    unlockStaffAction,
    initialState,
  )
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={memberId} />
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Unlock className="size-3.5" />
        )}
        Desbloquear
      </Button>
      {!state.ok && state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  )
}

function DeleteButton({ memberId }: { memberId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteStaffAction,
    initialState,
  )
  const [confirming, setConfirming] = React.useState(false)
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirming) {
          e.preventDefault()
          setConfirming(true)
        }
      }}
    >
      <input type="hidden" name="id" value={memberId} />
      <Button
        type="submit"
        disabled={pending}
        variant={confirming ? "destructive" : "outline"}
        size="sm"
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        {confirming ? "Confirmar eliminación" : "Eliminar acceso"}
      </Button>
      {!state.ok && state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  )
}
