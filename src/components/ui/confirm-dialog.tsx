"use client"

/**
 * ConfirmDialog — drop-in replacement for window.confirm() across the
 * admin UI. Use it for any irreversible-ish action (bulk delete, archive,
 * cancel order…) instead of the browser-native prompt, which leaks the
 * domain into the dialog header ("m90-sports.com says…") and can't be
 * styled.
 *
 * Usage (controlled):
 *   const [open, setOpen] = React.useState(false)
 *   const [pending, startTransition] = React.useTransition()
 *
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     variant="destructive"
 *     title={`¿Eliminar ${n} productos?`}
 *     description="Dejarán de verse en la tienda. Reversible desde la BD."
 *     confirmLabel="Eliminar"
 *     pending={pending}
 *     onConfirm={() => startTransition(async () => { await fn(); setOpen(false) })}
 *   />
 */

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Adds a red icon + flips the confirm button to destructive styling. */
  variant?: "default" | "destructive"
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void | Promise<void>
  /** Disables both buttons + shows a spinner on confirm while the
   *  parent's mutation is in flight. */
  pending?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  pending = false,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the user dismiss while the action is in flight —
        // would leave the UI in a weird "did it run?" state.
        if (pending && !next) return
        onOpenChange(next)
      }}
    >
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {isDestructive && (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/20">
                <AlertTriangle className="size-5" />
              </span>
            )}
            <div className="flex flex-1 flex-col gap-1.5 pr-6">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "min-w-[110px] gap-1.5",
              isDestructive &&
                "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Procesando…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
