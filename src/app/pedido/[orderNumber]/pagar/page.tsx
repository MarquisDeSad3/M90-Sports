import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Nav } from "@/components/nav"
import { WhatsappFloat } from "@/components/whatsapp-float"
import { getPublicOrder } from "@/lib/queries/public-order"
import { ProofUploadForm } from "./proof-upload-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

const M90_NAVY = "#011b53"

interface PageProps {
  params: Promise<{ orderNumber: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Subir comprobante · ${orderNumber}`,
    description: "Sube tu comprobante de pago para confirmar el pedido.",
    robots: { index: false, follow: false },
  }
}

export default async function PagarPage({ params }: PageProps) {
  const { orderNumber } = await params
  const order = await getPublicOrder(orderNumber)
  if (!order) notFound()

  // Already paid → bounce back to the tracking view.
  if (
    order.paymentStatus === "verified" ||
    order.status === "cancelled" ||
    order.paymentMethod === "cash_on_delivery"
  ) {
    redirect(`/pedido/${order.orderNumber}`)
  }

  const amountDue = order.depositAmount ?? order.total
  const lastPayment = order.payments[order.payments.length - 1] ?? null
  const wasRejected = lastPayment?.status === "failed"

  return (
    <main
      className="relative min-h-svh bg-[#f7ebc8]"
      style={{ color: M90_NAVY }}
    >
      <Nav />

      <section className="mx-auto max-w-2xl px-5 pt-28 pb-10 md:px-8 md:pt-32">
        <Link
          href={`/pedido/${order.orderNumber}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#011b53]/65 transition-colors hover:text-[#011b53]"
        >
          <ArrowLeft className="size-3.5" />
          Volver al pedido
        </Link>

        <header className="mt-4 flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#980e21]">
            Pedido #{order.orderNumber}
          </span>
          <h1
            className="font-display text-3xl leading-tight tracking-tight md:text-4xl"
            style={{ color: M90_NAVY }}
          >
            Sube tu comprobante de pago
          </h1>
          <p className="max-w-xl text-sm text-[#011b53]/75">
            Una vez verifiquemos el comprobante, reservamos tus jerseys y
            te avisamos por WhatsApp.
          </p>
        </header>

        {wasRejected && lastPayment?.rejectionReason && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
            <p className="text-sm font-semibold text-rose-900">
              Tu comprobante anterior fue rechazado
            </p>
            <p className="mt-0.5 text-xs text-rose-800">
              <span className="font-semibold">Razón:</span>{" "}
              {lastPayment.rejectionReason}
            </p>
          </div>
        )}

        {/* Amount summary */}
        <div className="mt-4 rounded-2xl bg-white/85 p-5 ring-1 ring-[rgba(1,27,83,0.08)]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#011b53]/65">
            Monto a pagar
          </h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl tabular-nums">
              ${amountDue.toFixed(2)}
            </span>
            <span className="text-xs text-[#011b53]/60">{order.currency}</span>
          </div>
          {order.depositAmount !== null && (
            <p className="mt-1 text-xs text-[#011b53]/65">
              Es la reserva del 30% para asegurar tus jerseys. El saldo de
              ${(order.balanceAmount ?? 0).toFixed(2)} lo pagas a la entrega.
            </p>
          )}
        </div>

        <ProofUploadForm
          orderNumber={order.orderNumber}
          defaultMethod={order.paymentMethod}
          amountDue={amountDue}
        />

        <div className="mt-6 rounded-2xl bg-[#011b53] p-5 text-[#efd9a3] md:p-6">
          <h3 className="font-display text-base">¿Tienes problemas para pagar?</h3>
          <p className="mt-1 text-xs text-[#efd9a3]/80">
            Escríbenos por WhatsApp y te ayudamos a coordinar el pago.
          </p>
          <a
            href={`https://wa.me/5363285022?text=${encodeURIComponent(
              `Hola M90, necesito ayuda con el pago del pedido #${order.orderNumber}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            WhatsApp M90
          </a>
        </div>
      </section>

      <WhatsappFloat />
    </main>
  )
}
