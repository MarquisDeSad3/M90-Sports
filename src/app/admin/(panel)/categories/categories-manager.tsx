"use client"

import * as React from "react"
import { useActionState } from "react"
import {
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  toggleCategoryVisibilityAction,
  updateCategoryAction,
  type ActionResult,
} from "./actions"
import type { AdminCategory } from "@/lib/queries/categories"

const initialState: ActionResult = { ok: false, error: "" }

interface ManagerProps {
  initial: AdminCategory[]
}

/**
 * Local editable copy of the categories list. Order is what the user
 * sees in the preview row; we sync it back to the server with
 * reorderCategoriesAction after every drag-drop.
 */
export function CategoriesManager({ initial }: ManagerProps) {
  const [items, setItems] = React.useState<AdminCategory[]>(initial)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [savingOrder, setSavingOrder] = React.useState(false)
  const [orderError, setOrderError] = React.useState<string | null>(null)

  // Refresh local state when the server pushes a new initial (after
  // create / edit / delete server actions revalidate the path).
  React.useEffect(() => {
    setItems(initial)
  }, [initial])

  // Group: top-level rows + their subcategories (preserving sort order
  // of each layer). Subcategory product counts roll up into the parent
  // for the storefront preview, so a parent like "Por encargo" still
  // looks meaningful even if it owns zero products directly.
  const childrenByParent = React.useMemo(() => {
    const map = new Map<string, AdminCategory[]>()
    for (const c of items) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? []
        list.push(c)
        map.set(c.parentId, list)
      }
    }
    return map
  }, [items])

  const topLevel = items.filter((c) => !c.parentId)

  const previewTabs = topLevel.filter((c) => {
    if (!c.visible) return false
    if (c.productCount > 0) return true
    const kids = childrenByParent.get(c.id) ?? []
    return kids.some((k) => k.productCount > 0)
  })

  async function persistOrder(next: AdminCategory[]) {
    setSavingOrder(true)
    setOrderError(null)
    const ids = next.map((c) => c.id)
    const result = await reorderCategoriesAction(ids)
    setSavingOrder(false)
    if (!result.ok) {
      setOrderError(result.error)
      // Revert to the server's last known order on failure so the UI
      // doesn't lie about what's persisted.
      setItems(initial)
    }
  }

  function handleDrop(fromId: string, toId: string) {
    if (fromId === toId) return
    setItems((current) => {
      const fromIdx = current.findIndex((c) => c.id === fromId)
      const toIdx = current.findIndex((c) => c.id === toId)
      if (fromIdx === -1 || toIdx === -1) return current
      const next = [...current]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved!)
      // Fire-and-forget — the result handler updates state if it fails.
      void persistOrder(next)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Storefront preview row */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <span>Vista previa del storefront</span>
            {savingOrder && (
              <span className="inline-flex items-center gap-1.5 text-xs normal-case tracking-normal text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Guardando orden…
              </span>
            )}
            {orderError && !savingOrder && (
              <span className="text-xs normal-case tracking-normal text-rose-600">
                {orderError}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-[#f7ebc8] p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#011b53] bg-[#011b53] px-4 py-2 text-sm font-semibold text-[#efd9a3]">
                Todo
              </span>
              {previewTabs.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-[rgba(1,27,83,0.18)] bg-white/70 px-4 py-2 text-sm font-semibold text-[#011b53]"
                >
                  {c.name}
                </span>
              ))}
            </div>
            {previewTabs.length === 0 && (
              <p className="text-xs text-[#011b53]/60">
                Solo aparece "Todo" hasta que añadas categorías con productos.
              </p>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Arrastra abajo para reordenar.
          </p>
        </CardContent>
      </Card>

      {/* Header + create */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length}{" "}
          {items.length === 1 ? "categoría" : "categorías"} en total
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
          parents={items}
          onDone={() => setCreateOpen(false)}
        />
      )}

      {/* Sortable list */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no hay categorías.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {topLevel.map((parent) => {
                const kids = childrenByParent.get(parent.id) ?? []
                return (
                  <React.Fragment key={parent.id}>
                    <SortableRow
                      category={parent}
                      parents={items}
                      isEditing={editingId === parent.id}
                      onEdit={() =>
                        setEditingId((v) =>
                          v === parent.id ? null : parent.id,
                        )
                      }
                      onDrop={handleDrop}
                    />
                    {kids.map((child) => (
                      <SortableRow
                        key={child.id}
                        category={child}
                        parents={items}
                        isEditing={editingId === child.id}
                        onEdit={() =>
                          setEditingId((v) =>
                            v === child.id ? null : child.id,
                          )
                        }
                        onDrop={handleDrop}
                        nested
                      />
                    ))}
                  </React.Fragment>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SortableRowProps {
  category: AdminCategory
  parents: AdminCategory[]
  isEditing: boolean
  onEdit: () => void
  onDrop: (fromId: string, toId: string) => void
  nested?: boolean
}

function SortableRow({
  category,
  parents,
  isEditing,
  onEdit,
  onDrop,
  nested = false,
}: SortableRowProps) {
  const [isDragOver, setDragOver] = React.useState(false)

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/category-id", category.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        const fromId = e.dataTransfer.getData("text/category-id")
        setDragOver(false)
        if (fromId) onDrop(fromId, category.id)
      }}
      className={cn(
        "flex flex-col gap-2 px-3 py-2.5 transition-colors",
        nested && "pl-9 bg-muted/20",
        isDragOver && "bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        {/* Pill (visual matches the storefront) */}
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "flex flex-1 items-center gap-2 truncate rounded-full border px-3 py-1.5 text-left text-sm font-semibold transition-all",
            category.visible
              ? "border-[rgba(1,27,83,0.18)] bg-[#f7ebc8] text-[#011b53] hover:border-[#011b53]/60"
              : "border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground line-through",
          )}
        >
          <span className="truncate">{category.name}</span>
          <span className="text-xs font-normal opacity-60">
            {category.productCount}
          </span>
        </button>

        <VisibilityToggle
          id={category.id}
          visible={category.visible}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label={isEditing ? "Cerrar editor" : "Editar"}
          className="size-8 p-0"
        >
          {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
        </Button>
      </div>

      {isEditing && (
        <div className="ml-9 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <CategoryForm
            mode="edit"
            category={category}
            parents={parents}
            compact
          />
          <DeleteButton
            categoryId={category.id}
            productCount={category.productCount}
          />
        </div>
      )}
    </li>
  )
}

function VisibilityToggle({
  id,
  visible,
}: {
  id: string
  visible: boolean
}) {
  const [state, formAction, pending] = useActionState(
    toggleCategoryVisibilityAction,
    initialState,
  )
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="visible" value={visible ? "false" : "true"} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        title={visible ? "Ocultar del storefront" : "Mostrar en el storefront"}
        className={cn(
          "size-8 p-0",
          visible
            ? "text-emerald-600 hover:text-emerald-700"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : visible ? (
          <Eye className="size-4" />
        ) : (
          <EyeOff className="size-4" />
        )}
      </Button>
      {!state.ok && state.error && (
        <span className="ml-2 text-xs text-rose-600">{state.error}</span>
      )}
    </form>
  )
}

function CategoryForm({
  mode,
  category,
  parents,
  compact = false,
  onDone,
}: {
  mode: "create" | "edit"
  category?: AdminCategory
  parents: AdminCategory[]
  compact?: boolean
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

  const parentOptions = parents.filter((p) => p.id !== category?.id)

  const Wrapper = compact
    ? React.Fragment
    : ({ children }: { children: React.ReactNode }) => (
        <Card>
          {mode === "create" && (
            <CardHeader>
              <CardTitle className="text-base">Nueva categoría</CardTitle>
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </Card>
      )

  return (
    <Wrapper>
      <form action={formAction} className="grid gap-3 md:grid-cols-2">
        {mode === "edit" && (
          <input type="hidden" name="id" value={category!.id} />
        )}
        <input
          type="hidden"
          name="position"
          value={category?.position ?? 0}
        />

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
          hint="Si lo dejas vacío se genera del nombre"
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

        <Field label="Descripción" className="md:col-span-2">
          <Input
            name="description"
            defaultValue={category?.description ?? ""}
            maxLength={500}
            placeholder="Camisetas oficiales y retro de fútbol"
          />
        </Field>

        <Field label="Imagen (URL)" className="md:col-span-2">
          <Input
            name="imageUrl"
            defaultValue={category?.imageUrl ?? ""}
            type="url"
            maxLength={500}
            placeholder="https://..."
          />
        </Field>

        <details className="md:col-span-2">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground">
            SEO (opcional)
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="SEO Title">
              <Input
                name="seoTitle"
                defaultValue={category?.seoTitle ?? ""}
                maxLength={120}
              />
            </Field>
            <Field label="SEO Description">
              <Input
                name="seoDescription"
                defaultValue={category?.seoDescription ?? ""}
                maxLength={300}
              />
            </Field>
          </div>
        </details>

        <div className="flex items-center gap-3 md:col-span-2">
          <Switch
            name="visible"
            checked={visible}
            onCheckedChange={setVisible}
          />
          <Label className="text-sm">Visible en el storefront</Label>
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} size="sm" className="gap-2">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {mode === "create" ? "Crear" : "Guardar"}
          </Button>
          {state.ok && mode === "edit" && (
            <span className="text-xs text-emerald-600">Guardado</span>
          )}
          {!state.ok && state.error && (
            <span className="text-sm text-rose-600">{state.error}</span>
          )}
        </div>
      </form>
    </Wrapper>
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
        variant={confirming ? "destructive" : "ghost"}
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
          : "Eliminar"}
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
