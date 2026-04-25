"use client"

import * as React from "react"
import {
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface UploadedImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  fileName?: string
  fileSizeKb?: number
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  max?: number
  team?: string
}

export function ImageUploader({
  images,
  onChange,
  max = 8,
  team = "M90",
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const triggerFile = () => inputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = Math.max(0, max - images.length)
    const filesToAdd = Array.from(files).slice(0, remaining)
    const newImages = filesToAdd.map((file, i) => ({
      id: `img_${Date.now()}_${i}`,
      url: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^.]+$/, ""),
      isPrimary: images.length === 0 && i === 0,
      fileName: file.name,
      fileSizeKb: Math.round(file.size / 1024),
    }))
    onChange([...images, ...newImages])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const setPrimary = (id: string) => {
    onChange(
      images.map((img) => ({ ...img, isPrimary: img.id === id }))
    )
  }

  const remove = (id: string) => {
    const next = images.filter((img) => img.id !== id)
    if (!next.some((img) => img.isPrimary) && next.length > 0) {
      next[0].isPrimary = true
    }
    onChange(next)
  }

  const updateAlt = (id: string, alt: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, alt } : img)))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      {images.length < max && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={triggerFile}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 md:p-8",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div
            className={cn(
              "grid size-11 place-items-center rounded-full transition-colors",
              isDragging
                ? "bg-primary/15 text-primary"
                : "bg-background text-muted-foreground group-hover:text-primary"
            )}
          >
            <UploadCloud className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">
              {isDragging
                ? "Suelta para añadir"
                : "Arrastra imágenes aquí o haz click"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP — hasta {max} imágenes
            </p>
          </div>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted/40",
                img.isPrimary && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="h-full w-full object-cover"
              />

              {/* Primary badge */}
              {img.isPrimary && (
                <Badge className="absolute left-2 top-2 gap-1 bg-primary text-primary-foreground">
                  <Star className="size-3 fill-current" /> Principal
                </Badge>
              )}

              {/* Position number */}
              <div className="absolute right-2 top-2 grid size-6 place-items-center rounded-md bg-black/40 text-[11px] font-bold text-white backdrop-blur-sm">
                {i + 1}
              </div>

              {/* Hover overlay with actions */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  className="grid size-7 place-items-center rounded-md bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                  aria-label="Reordenar (drag)"
                >
                  <GripVertical className="size-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      className="grid size-7 place-items-center rounded-md bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
                      aria-label="Marcar como principal"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    className="grid size-7 place-items-center rounded-md bg-rose-500/80 text-white backdrop-blur transition-colors hover:bg-rose-500"
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add more tile */}
          {images.length < max && (
            <button
              type="button"
              onClick={triggerFile}
              className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-primary"
              aria-label="Añadir más imágenes"
            >
              <div className="flex flex-col items-center gap-1">
                <ImagePlus className="size-5" />
                <span className="text-[11px] font-medium">Añadir</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {images.length} / {max} imágenes
        </span>
        {images.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="h-7 text-xs text-muted-foreground"
          >
            Limpiar todas
          </Button>
        )}
      </div>
    </div>
  )
}
