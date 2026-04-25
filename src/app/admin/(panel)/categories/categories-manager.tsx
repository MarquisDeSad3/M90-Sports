"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  Eye,
  EyeOff,
  FolderTree,
  Loader2,
  Plus,
  Trash2,
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from "./actions"
import type { AdminCategory } from "@/lib/queries/categories"

const initialState: ActionResult = { ok: false, error: "" }

interface ManagerProps {
  initial: AdminCategory[]
}

export function CategoriesManager({ initial }: ManagerProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {initial.length}{" "}
          {initial.length === 1 ? "categoría" : "categorías"} en el catálogo
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
              <Plus className="size-4" /> Nueva categoría
            </>
          )}
        </Button>
      </div>

      {createOpen && (
        <CategoryForm
          mode="create"
          parents={initial}
          onDone={() => setCreateOpen(false)}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {initial.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <FolderTree className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                Aún no hay categorías. Crea la primera para organizar el catálogo.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {initial.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  parents={initial}
                  isExpanded={editingId === c.id}
                  onToggle={() =>
                    setEditingId((v) => (v === c.id ? null : c.id))
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

function CategoryRow({
  category,
  parents,
  isExpanded,
  onToggle,
}: {
  category: AdminCategory
  parents: AdminCategory[]
  isExpanded: boolean
  onToggle: () => void
}) {
  const parentName =
    parents.find((p) => p.id === category.parentId)?.name ?? null

  return (
    <li className="px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {category.name}
            </span>
            {parentName && (
              <span className="text-[11px] text-muted-foreground">
                ↳ hija de {parentName}
              </span>
            )}
            {!category.visible && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <EyeOff className="size-3" /> oculta
              </Badge>
            )}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            /{category.slug} · {category.productCount} producto
            {category.productCount === 1 ? "" : "s"} · posición{" "}
            {category.position}
          </span>
        </div>
        <Badge variant={category.visible ? "success" : "secondary"} className="gap-1">
          {category.visible ? (
            <Eye className="size-3" />
          ) : (
            <EyeOff className="size-3" />
          )}
          {category.visible ? "Visible" : "Oculta"}
        </Badge>
      </button>

      {isExpanded && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <CategoryForm mode="edit" category={category} parents={parents} />
          <DeleteButton categoryId={category.id} productCount={category.productCount} />
        </div>
      )}
    </li>
  )
}

function CategoryForm({
  mode,
  category,
  parents,
  onDone,
}: {
  mode: "create" | "edit"
  category?: AdminCategory
  parents: AdminCategory[]
  onDone?: () => void
}) {
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createCategoryAction : updateCategoryAction,
    initialState,
  )
  const [parentId, setParentId] = React.useState<string>(
    category?.parentId ?? "",
  )
  const [visible, setVisible] = React.useState<boolean>(
    category?.visible ?? true,
  )

  React.useEffect(() => {
    if (state.ok && mode === "create" && onDone) onDone()
  }, [state.ok, mode, onDone])

  // For edits, only categories that aren't the row itself or its
  // descendants are valid parents. We don't compute the full descendant
  // set here (rare edit path) — just exclude self.
  const parentOptions = parents.filter((p) => p.id !== category?.id)

  return (
    <Card className={mode === "create" ? "" : "border-0 shadow-none"}>
      {mode === "create" && (
        <CardHeader>
          <CardTitle className="text-base">Nueva categoría</CardTitle>
        </CardHeader>
      )}
      <CardContent className={mode === "create" ? "" : "p-0"}>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          {mode === "edit" && (
            <input type="hidden" name="id" value={category!.id} />
          )}

          <Field label="Nombre">
            <Input
              name="name"
              defaultValue={category?.name ?? ""}
              required
              maxLength={80}
              placeholder="NBA"
            />
          </Field>

          <Field
            label="Slug"
            hint="Lo que aparece en la URL. Si lo dejas vacío se genera del nombre."
          >
            <Input
              name="slug"
              defaultValue={category?.slug ?? ""}
              maxLength={80}
              placeholder="nba"
            />
          </Field>

          <Field label="Categoría padre" className="md:col-span-2">
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin padre (raíz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin padre (raíz)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="parentId"
              value={parentId === "__none__" ? "" : parentId}
            />
          </Field>

          <Field
            label="Descripción"
            hint="Texto corto opcional para la página de la categoría"
            className="md:col-span-2"
          >
            <Input
              name="description"
              defaultValue={category?.description ?? ""}
              maxLength={500}
              placeholder="Camisetas oficiales y retro de fútbol"
            />
          </Field>

          <Field label="Imagen (URL)">
            <Input
              name="imageUrl"
              defaultValue={category?.imageUrl ?? ""}
              type="url"
              maxLength={500}
              placeholder="https://..."
            />
          </Field>

          <Field
            label="Posición"
            hint="Más bajo = aparece primero en el storefront"
          >
            <Input
              name="position"
              type="number"
              min={0}
              max={9999}
              defaultValue={category?.position ?? 0}
            />
          </Field>

          <Field label="SEO Title" className="md:col-span-2">
            <Input
              name="seoTitle"
              defaultValue={category?.seoTitle ?? ""}
              maxLength={120}
              placeholder="(opcional, sobreescribe el título por defecto)"
            />
          </Field>

          <Field label="SEO Description" className="md:col-span-2">
            <Input
              name="seoDescription"
              defaultValue={category?.seoDescription ?? ""}
              maxLength={300}
              placeholder="(opcional)"
            />
          </Field>

          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              name="visible"
              checked={visible}
              onCheckedChange={setVisible}
            />
            <Label className="text-sm">
              Visible en el storefront
            </Label>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {mode === "create" ? "Crear categoría" : "Guardar cambios"}
            </Button>
            {state.ok && mode === "edit" && (
              <span className="text-xs text-emerald-600">Guardado</span>
            )}
            {!state.ok && state.error && (
              <span className="text-sm text-rose-600">{state.error}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function DeleteButton({
  categoryId,
  productCount,
}: {
  categoryId: string
  productCount: number
}) {
  const [state, formAction, pending] = useActionState(
    deleteCategoryAction,
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
      <input type="hidden" name="id" value={categoryId} />
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
        {confirming
          ? productCount > 0
            ? `Confirmar (afecta ${productCount} producto${productCount === 1 ? "" : "s"})`
            : "Confirmar eliminación"
          : "Eliminar categoría"}
      </Button>
      {!state.ok && state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  )
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}
