"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Method = "transfermovil" | "zelle" | "paypal"

const METHODS: { id: Method; label: string; instructions: string }[] = [
  {
    id: "transfermovil",
    label: "Transfermóvil",
    instructions:
      "Tarjeta MLC: 9210 5995 0123 4567 · Concepto: tu número de pedido",
  },
  {
    id: "zelle",
    label: "Zelle",
    instructions: "m90sports@gmail.com · Concepto: tu número de pedido",
  },
  {
    id: "paypal",
    label: "PayPal",
    instructions: "@m90sports · Asunto: tu número de pedido",
  },
]

interface Props {
  orderNumber: string
  defaultMethod: string | null
  amountDue: number
}

export function ProofUploadForm({
  orderNumber,
  defaultMethod,
  amountDue,
}: Props) {
  const router = useRouter()
  const [method, setMethod] = React.useState<Method>(
    defaultMethod === "zelle" || defaultMethod === "paypal"
      ? defaultMethod
      : "transfermovil",
  )
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [transactionRef, setTransactionRef] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const selectedMethod = METHODS.find((m) => m.id === method)!

  function handleFile(f: File | null) {
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (!/^image\/(jpeg|png|webp|jpg)$/.test(f.type)) {
      setError("Sube una imagen (JPG, PNG o WebP).")
      setFile(null)
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("La imagen pesa más de 5 MB. Comprímela un poco.")
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("Selecciona el comprobante primero.")
      return
    }
    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("method", method)
    if (transactionRef.trim()) {
      formData.append("transactionRef", transactionRef.trim())
    }

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/proof`,
        { method: "POST", body: formData },
      )
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(json.error ?? "No se pudo subir el comprobante.")
      }
      setSuccess(true)
      // Brief beat for the success state to register, then redirect.
      window.setTimeout(() => {
        router.push(`/pedido/${orderNumber}`)
        router.refresh()
      }, 900)
    } catch (err) {
      setError((err as Error).message ?? "Error inesperado.")
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
        <div className="grid size-12 place-items-center rounded-full bg-emerald-600 text-white">
          <Check className="size-6" />
        </div>
        <h2 className="font-display text-2xl text-emerald-900">
          Comprobante recibido
        </h2>
        <p className="max-w-sm text-sm text-emerald-800">
          Lo verificamos en las próximas horas y te avisamos por WhatsApp.
          Te llevamos al estado del pedido…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      {/* Method picker */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
          Método de pago
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const active = method === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                  active
                    ? "border-[#011b53] bg-[#011b53] text-[#efd9a3]"
                    : "border-[rgba(1,27,83,0.18)] bg-white text-[#011b53] hover:border-[#011b53]/60",
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 rounded-xl bg-[rgba(1,27,83,0.05)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Datos para enviar ${amountDue.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-[#011b53]">
            {selectedMethod.instructions}
          </p>
        </div>
      </div>

      {/* File upload */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
          Foto del comprobante
        </h3>
        {!file ? (
          <label
            className={cn(
              "mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgba(1,27,83,0.2)] bg-[rgba(1,27,83,0.02)] px-4 py-6 text-center transition-colors hover:border-[#011b53]/60 hover:bg-[rgba(1,27,83,0.04)]",
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              disabled={submitting}
            />
            <ImagePlus className="size-8 text-[#011b53]/45" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-[#011b53]">
                Toca para seleccionar
              </span>
              <span className="text-[11px] text-[#011b53]/55">
                JPG, PNG o WebP · Máx. 5 MB
              </span>
            </div>
          </label>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-xl bg-[rgba(1,27,83,0.05)]">
              {previewUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Comprobante"
                  className="max-h-72 w-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={() => handleFile(null)}
                disabled={submitting}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
                aria-label="Quitar imagen"
              >
                <X className="size-4" />
              </button>
            </div>
            <span className="text-xs text-[#011b53]/65 truncate">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
        )}
      </div>

      {/* Transaction ref */}
      <div className="rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Referencia de transacción <span className="lowercase">(opcional)</span>
          </span>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="Ej. TRF-12345 o número de operación"
            maxLength={80}
            disabled={submitting}
            className="rounded-lg border border-[rgba(1,27,83,0.18)] bg-white px-3 py-2.5 text-sm font-mono tabular-nums text-[#011b53] placeholder:font-sans placeholder:text-[#011b53]/40 focus:border-[#011b53] focus:outline-none focus:ring-2 focus:ring-[#011b53]/15"
          />
          <span className="text-[11px] text-[#011b53]/55">
            Si Transfermóvil te dio un número de operación, ponlo acá.
            Acelera la verificación.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file || submitting}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition-all",
          !file || submitting
            ? "cursor-not-allowed bg-[rgba(1,27,83,0.15)] text-white"
            : "bg-[#011b53] text-[#efd9a3] hover:-translate-y-0.5 hover:bg-[#0a2a75]",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Subiendo…
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Enviar comprobante
          </>
        )}
      </button>
    </form>
  )
}
