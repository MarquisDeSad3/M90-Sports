"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createProduct as createProductAction,
  updateProduct as updateProductAction,
  deleteProduct as deleteProductAction,
} from "@/app/admin/(panel)/products/actions"
import {
  ImageUploader,
  type UploadedImage,
} from "./image-uploader"
import { VariantsEditor, type VariantRow } from "./variants-editor"
import {
  LEAGUE_LABEL,
  VERSION_LABEL,
  type League,
  type MockProduct,
  type ProductStatus,
  type VersionType,
} from "@/lib/mock-data"

interface ProductFormProps {
  product?: MockProduct
  mode: "create" | "edit"
  /**
   * Whether the current admin can see/edit unit cost. Owners and
   * managers see margin info; staff and viewers don't.
   */
  canSeeCost?: boolean
  /**
   * All categories the product can be assigned to. Read at the page
   * level once; the form just renders the multi-select.
   */
  availableCategories?: { id: string; name: string }[]
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

export function ProductForm({
  product,
  mode,
  canSeeCost = false,
  availableCategories = [],
}: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [name, setName] = React.useState(product?.name ?? "")
  const [slug, setSlug] = React.useState(product?.slug ?? "")
  const [team, setTeam] = React.useState(product?.team ?? "")
  const [player, setPlayer] = React.useState(product?.player ?? "")
  const [number, setNumber] = React.useState(product?.number ?? "")
  const [season, setSeason] = React.useState(product?.season ?? "")
  const [league, setLeague] = React.useState<League>(product?.league ?? "NBA")
  const [versionType, setVersionType] = React.useState<VersionType>(
    product?.versionType ?? "home"
  )
  const [description, setDescription] = React.useState(
    product?.description ?? ""
  )
  const [basePrice, setBasePrice] = React.useState(
    product?.basePrice?.toString() ?? ""
  )
  const [compareAtPrice, setCompareAtPrice] = React.useState(
    product?.compareAtPrice?.toString() ?? ""
  )
  const [costPerItem, setCostPerItem] = React.useState(
    product?.costPerItem?.toString() ?? ""
  )
  const [status, setStatus] = React.useState<ProductStatus>(
    product?.status ?? "draft"
  )
  const [featured, setFeatured] = React.useState(product?.featured ?? false)
  const [isPreorder, setIsPreorder] = React.useState(
    product?.isPreorder ?? false
  )
  const [preorderDate, setPreorderDate] = React.useState(
    product?.preorderReleaseDate ?? ""
  )
  const [seoTitle, setSeoTitle] = React.useState("")
  const [seoDescription, setSeoDescription] = React.useState("")
  const [tags, setTags] = React.useState<string[]>(product?.tags ?? [])
  const [tagInput, setTagInput] = React.useState("")
  const [categoryIds, setCategoryIds] = React.useState<string[]>(
    product?.categories ?? [],
  )

  // Hydrate the uploader with whatever the product already has stored.
  // The primary image goes first so the "Principal" star reflects DB truth.
  const [images, setImages] = React.useState<UploadedImage[]>(() => {
    if (!product) return []
    const list: UploadedImage[] = []
    if (product.primaryImage) {
      list.push({
        id: `existing_primary`,
        url: product.primaryImage,
        alt: product.name,
        isPrimary: true,
      })
    }
    return list
  })

  const [variants, setVariants] = React.useState<VariantRow[]>(
    product?.variants?.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
      price: v.price,
    })) ?? []
  )

  const [autoSlug, setAutoSlug] = React.useState(mode === "create")

  React.useEffect(() => {
    if (autoSlug && name) {
      setSlug(slugify(name))
    }
  }, [name, autoSlug])

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
  }

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const input = {
      name: name.trim(),
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || undefined,
      team: team || undefined,
      player: player || undefined,
      number: number || undefined,
      season: season || undefined,
      league,
      versionType,
      status,
      basePrice: Number(basePrice) || 0,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPerItem: costPerItem ? Number(costPerItem) : undefined,
      featured,
      isPreorder,
      preorderReleaseDate: isPreorder && preorderDate ? preorderDate : undefined,
      variants: variants.map((v) => ({
        size: v.size,
        stock: v.stock,
        sku: v.sku,
        price: v.price,
      })),
      categoryIds,
      images: images.map((img, idx) => ({
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        position: idx,
      })),
    }

    const result =
      mode === "create"
        ? await createProductAction(input)
        : await updateProductAction(product!.id, input)

    setSaving(false)
    if (!result.ok) {
      toast.error("No se pudo guardar", { description: result.error })
      return
    }
    toast.success(
      mode === "create" ? "Producto creado" : "Cambios guardados"
    )
    router.push("/admin/products")
  }

  const [deleting, setDeleting] = React.useState(false)
  const handleDelete = async () => {
    if (!product) return
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return
    setDeleting(true)
    const result = await deleteProductAction(product.id)
    setDeleting(false)
    if (result && !result.ok) {
      toast.error("No se pudo eliminar", { description: result.error })
      return
    }
    toast.success("Producto eliminado")
    // deleteProductAction redirects internally, but just in case:
    router.push("/admin/products")
  }

  const titleText =
    mode === "create" ? "Nuevo producto" : product?.name ?? "Editar producto"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="size-9 shrink-0">
            <Link href="/admin/products" aria-label="Volver">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
              {titleText}
            </h2>
            {mode === "edit" && product && (
              <p className="text-xs text-muted-foreground">
                Última actualización ·{" "}
                {new Date(product.updatedAt).toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/admin/products")}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {mode === "create" ? "Crear producto" : "Guardar"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {/* LEFT: main */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* General */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Información general</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre del producto *</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jersey Lakers Kobe Bryant 1996-97"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {autoSlug ? "Editar manual" : "Auto desde nombre"}
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /jerseys/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value)
                      setAutoSlug(false)
                    }}
                    placeholder="lakers-bryant-9697"
                    className="pl-[68px] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="team">Equipo *</Label>
                  <Input
                    id="team"
                    required
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Los Angeles Lakers"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="season">Temporada</Label>
                  <Input
                    id="season"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="1996-97"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="player">Jugador</Label>
                  <Input
                    id="player"
                    value={player}
                    onChange={(e) => setPlayer(e.target.value)}
                    placeholder="Kobe Bryant"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="number">Dorsal</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="8"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Liga</Label>
                  <Select
                    value={league}
                    onValueChange={(v) => setLeague(v as League)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["NBA", "NFL", "MLB", "FUTBOL", "OTRO"] as League[]).map(
                        (l) => (
                          <SelectItem key={l} value={l}>
                            {LEAGUE_LABEL[l]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tipo de versión</Label>
                <Select
                  value={versionType}
                  onValueChange={(v) => setVersionType(v as VersionType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "home",
                        "away",
                        "alternate",
                        "retro",
                        "city",
                        "all_star",
                        "throwback",
                      ] as VersionType[]
                    ).map((v) => (
                      <SelectItem key={v} value={v}>
                        {VERSION_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuenta la historia del producto. Material, fit, momento histórico, lo que vende."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Imágenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={images}
                onChange={setImages}
                team={team}
              />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Variantes (tallas)</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantsEditor
                variants={variants}
                onChange={setVariants}
                basePrice={Number(basePrice) || 0}
                baseSku="M90"
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seoTitle">Title (Google)</Label>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name || "Jersey Lakers Bryant 1996-97 — M90 Sports"}
                  maxLength={70}
                />
                <span className="text-[10px] text-muted-foreground">
                  {seoTitle.length}/70 caracteres
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seoDescription">Meta description</Label>
                <Textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Descripción que aparece en buscadores. 150-160 caracteres ideal."
                  maxLength={170}
                  rows={3}
                />
                <span className="text-[10px] text-muted-foreground">
                  {seoDescription.length}/170 caracteres
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: sticky sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProductStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">📝 Borrador</SelectItem>
                  <SelectItem value="published">✅ Publicado</SelectItem>
                  <SelectItem value="archived">📦 Archivado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Destacado
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Aparece en home
                  </span>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Precio</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="basePrice">Precio (USD) *</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="basePrice"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="65.00"
                    className="pl-7 tabular-nums"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="compareAt">Precio antes (tachado)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="compareAt"
                    type="number"
                    min={0}
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="80.00"
                    className="pl-7 tabular-nums"
                  />
                </div>
              </div>
              {canSeeCost && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cost">Coste por unidad (privado)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="cost"
                        type="number"
                        min={0}
                        step="0.01"
                        value={costPerItem}
                        onChange={(e) => setCostPerItem(e.target.value)}
                        placeholder="28.00"
                        className="pl-7 tabular-nums"
                      />
                    </div>
                    {basePrice && costPerItem && (
                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span className="text-muted-foreground">Margen:</span>
                    <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                      $
                      {(Number(basePrice) - Number(costPerItem)).toFixed(2)} ·{" "}
                      {(
                        ((Number(basePrice) - Number(costPerItem)) /
                          Number(basePrice)) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </span>
                )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {availableCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay categorías creadas todavía. Ve a{" "}
                  <a
                    href="/admin/categories"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Categorías
                  </a>{" "}
                  para crear la primera.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Marca todas las categorías a las que pertenece este producto.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCategories.map((c) => {
                      const selected = categoryIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setCategoryIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== c.id)
                                : [...prev, c.id],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/40",
                          )}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Bryant, Lakers, Retro..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addTag(tagInput)
                      setTagInput("")
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => {
                    addTag(tagInput)
                    setTagInput("")
                  }}
                >
                  Añadir
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="cursor-pointer gap-1 hover:bg-rose-500/15 hover:text-rose-700"
                      onClick={() => removeTag(t)}
                    >
                      {t}
                      <span className="text-muted-foreground hover:text-rose-700">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pre-order */}
          <Card className="rounded-xl border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Pre-orden</span>
                <Switch checked={isPreorder} onCheckedChange={setIsPreorder} />
              </CardTitle>
            </CardHeader>
            {isPreorder && (
              <CardContent className="flex flex-col gap-3 pt-0">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="preorderDate">Fecha estimada llegada</Label>
                  <Input
                    id="preorderDate"
                    type="date"
                    value={preorderDate}
                    onChange={(e) => setPreorderDate(e.target.value)}
                  />
                </div>
                <p className="rounded-md bg-sky-500/10 px-3 py-2 text-[11px] leading-relaxed text-sky-700 dark:text-sky-300">
                  Los clientes podrán reservar este producto. Cobras el total o un
                  depósito según política.
                </p>
              </CardContent>
            )}
          </Card>

          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Eye className="size-4" />
              Ver en tienda
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
