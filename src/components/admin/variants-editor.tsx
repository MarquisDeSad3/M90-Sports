"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Size } from "@/lib/mock-data"

export interface VariantRow {
  id: string
  size: Size
  stock: number
  sku: string
  price?: number
}

const SIZE_OPTIONS: { value: Size; label: string; group: string }[] = [
  { value: "XS", label: "XS", group: "Adulto" },
  { value: "S", label: "S", group: "Adulto" },
  { value: "M", label: "M", group: "Adulto" },
  { value: "L", label: "L", group: "Adulto" },
  { value: "XL", label: "XL", group: "Adulto" },
  { value: "XXL", label: "2XL", group: "Adulto" },
  { value: "XXXL", label: "3XL", group: "Adulto" },
  { value: "XXXXL", label: "4XL", group: "Adulto" },
  { value: "KIDS_4", label: "4 años", group: "Niños" },
  { value: "KIDS_6", label: "6 años", group: "Niños" },
  { value: "KIDS_8", label: "8 años", group: "Niños" },
  { value: "KIDS_10", label: "10 años", group: "Niños" },
  { value: "KIDS_12", label: "12 años", group: "Niños" },
  { value: "KIDS_14", label: "14 años", group: "Niños" },
  { value: "ONE_SIZE", label: "Talla única", group: "Otros" },
]

interface VariantsEditorProps {
  variants: VariantRow[]
  onChange: (variants: VariantRow[]) => void
  basePrice: number
  baseSku?: string
}

export function VariantsEditor({
  variants,
  onChange,
  basePrice,
  baseSku = "M90",
}: VariantsEditorProps) {
  const totalStock = variants.reduce((s, v) => s + v.stock, 0)

  const addAdultStandard = () => {
    const sizes: Size[] = ["S", "M", "L", "XL"]
    const existing = new Set(variants.map((v) => v.size))
    const toAdd = sizes
      .filter((s) => !existing.has(s))
      .map((size) => ({
        id: `var_${Date.now()}_${size}`,
        size,
        stock: 0,
        sku: `${baseSku}-${size}`,
      }))
    onChange([...variants, ...toAdd])
  }

  const addRow = () => {
    onChange([
      ...variants,
      {
        id: `var_${Date.now()}`,
        size: "M",
        stock: 0,
        sku: `${baseSku}-M`,
      },
    ])
  }

  const updateRow = (id: string, patch: Partial<VariantRow>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  const removeRow = (id: string) => {
    onChange(variants.filter((v) => v.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quick action buttons */}
      {variants.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay variantes. Añade tallas para empezar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addAdultStandard}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> S, M, L, XL
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRow}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Una talla
            </Button>
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">Talla</th>
                  <th className="px-3 py-2.5 text-left font-medium">SKU</th>
                  <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Precio (override)
                  </th>
                  <th className="w-10 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((v) => (
                  <tr key={v.id} className="hover:bg-accent/30">
                    <td className="px-3 py-2">
                      <Select
                        value={v.size}
                        onValueChange={(val) =>
                          updateRow(v.id, { size: val as Size })
                        }
                      >
                        <SelectTrigger size="sm" className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={v.sku}
                        onChange={(e) =>
                          updateRow(v.id, { sku: e.target.value })
                        }
                        className="h-8 font-mono text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) =>
                          updateRow(v.id, { stock: Number(e.target.value) || 0 })
                        }
                        className="h-8 w-[80px] text-right tabular-nums ml-auto"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder={String(basePrice)}
                          value={v.price ?? ""}
                          onChange={(e) =>
                            updateRow(v.id, {
                              price: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="h-8 w-[90px] text-right tabular-nums"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                        onClick={() => removeRow(v.id)}
                        aria-label="Eliminar variante"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {variants.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <Select
                    value={v.size}
                    onValueChange={(val) =>
                      updateRow(v.id, { size: val as Size })
                    }
                  >
                    <SelectTrigger size="sm" className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                    onClick={() => removeRow(v.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Stock
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) =>
                        updateRow(v.id, { stock: Number(e.target.value) || 0 })
                      }
                      className="h-9 tabular-nums"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Precio override
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`$${basePrice}`}
                      value={v.price ?? ""}
                      onChange={(e) =>
                        updateRow(v.id, {
                          price: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="h-9 tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    SKU
                  </label>
                  <Input
                    value={v.sku}
                    onChange={(e) =>
                      updateRow(v.id, { sku: e.target.value })
                    }
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRow}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Añadir variante
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="tabular-nums">
                {variants.length} {variants.length === 1 ? "talla" : "tallas"}
              </Badge>
              <Badge variant="secondary" className="tabular-nums">
                {totalStock} en stock
              </Badge>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
