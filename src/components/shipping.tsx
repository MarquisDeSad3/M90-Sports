"use client";

import { motion } from "framer-motion";
import { ArrowRight, Plane, ShieldCheck, Clock, Banknote, Truck } from "lucide-react";
import { asset } from "@/lib/utils";
import {
  CashIcon,
  PayPalIcon,
  ZelleIcon,
} from "@/components/payment-icons";

// Pago: tres canales — Zelle, PayPal, efectivo a la entrega. Sin
// captions sub-line: Ever pidió expresamente que no apareciera
// "diáspora" en la UI, y dejar solo los logos + nombre se ve más
// limpio que captions arbitrarios.
const PAYMENTS = [
  { name: "Zelle", Icon: ZelleIcon },
  { name: "PayPal", Icon: PayPalIcon },
  { name: "Efectivo", Icon: CashIcon },
] as const;

export function Shipping() {
  return (
    <section
      id="envios"
      className="relative overflow-hidden bg-[color:var(--color-cream-soft)] py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: shipping */}
          <div>
            <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red)]">
              <span className="h-px w-10 bg-[color:var(--color-red)]" />
              Cobertura en Cuba
            </div>
            <h2 className="mt-4 font-display text-5xl italic text-[color:var(--color-navy)] md:text-7xl">
              De punta
              <br />a punta<span className="text-[color:var(--color-red)]">.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[color:var(--color-navy)]/70">
              Llegamos a las 16 provincias. La mayoría de los pedidos
              vienen del exterior — abajo te explicamos los tiempos
              reales para que no tengas sorpresas. Tarifa exacta de
              envío te la confirmamos por WhatsApp antes de pagar.
            </p>

            {/* Timeline en dos fases — sustituye el viejo grid de
                provincias. La realidad operativa de M90 es que los
                productos llegan a Cuba primero (25-30 días) y de ahí
                a la provincia (1-2 semanas), no que cada provincia
                tenga un tiempo único. Estos son los números que el
                cliente necesita ANTES de comprar. */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
              {/* Fase 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-[color:var(--color-navy)]/10 bg-white/70 p-6"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-red)]">
                  <Plane size={14} />
                  Fase 1
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-5xl italic leading-none text-[color:var(--color-red)]">
                    25–30
                  </span>
                  <span className="text-sm font-semibold text-[color:var(--color-navy)]/70">
                    días
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[color:var(--color-navy)]">
                  Llegada del pedido a Cuba
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-navy)]/60">
                  Después de cerrar la ronda de pedidos del exterior.
                </p>
              </motion.div>

              {/* Connector arrow — sólo visible en desktop */}
              <div className="hidden items-center justify-center sm:flex">
                <ArrowRight
                  size={28}
                  className="text-[color:var(--color-navy)]/30"
                />
              </div>

              {/* Fase 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-2xl border border-[color:var(--color-red)]/30 bg-[color:var(--color-red)]/[0.04] p-6"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-red)]">
                  <Truck size={14} />
                  Fase 2
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-5xl italic leading-none text-[color:var(--color-red)]">
                    1–2
                  </span>
                  <span className="text-sm font-semibold text-[color:var(--color-navy)]/70">
                    semanas
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[color:var(--color-navy)]">
                  Entrega en tu provincia
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-navy)]/60">
                  Mensajería con seguimiento. Más rápido en occidente
                  y centro.
                </p>
              </motion.div>
            </div>

            {/* Total combinado, en una sola línea — ayuda al lector
                a hacer la suma rápida sin tener que entrecerrar los
                ojos. */}
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-navy)]/50">
              Total estimado · 4 a 8 semanas desde el cierre
            </p>
          </div>

          {/* Right: trust + payments */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-[color:var(--color-navy)] p-8 text-[color:var(--color-cream)]"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `url(${asset("/patterns/m90-pattern-cream.webp")})`,
                  backgroundSize: "260px auto",
                }}
              />
              <div className="relative">
                <ShieldCheck size={28} className="text-[color:var(--color-red-bright)]" />
                <h3 className="mt-5 font-display text-3xl italic">
                  Garantía M90
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-cream)]/80">
                  Si el producto no es como lo mostramos, lo cambiamos o te
                  devolvemos tu dinero. Así de simple.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Clock size={16} className="text-[color:var(--color-cream)]/60" />
                    <div className="mt-3 font-display text-2xl italic">48h</div>
                    <div className="text-xs uppercase tracking-widest text-[color:var(--color-cream)]/60">
                      resp. promedio
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Banknote size={16} className="text-[color:var(--color-cream)]/60" />
                    <div className="mt-3 font-display text-2xl italic">0</div>
                    <div className="text-xs uppercase tracking-widest text-[color:var(--color-cream)]/60">
                      adelantos sin fotos
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-[color:var(--color-navy)]/10 bg-white/60 p-8 backdrop-blur"
            >
              <h3 className="font-display text-2xl italic text-[color:var(--color-navy)]">
                Formas de pago
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-navy)]/60">
                Paga por el canal que te venga mejor.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {PAYMENTS.map(({ name, Icon }) => (
                  <div
                    key={name}
                    className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-[color:var(--color-navy)]/10 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-red)]/40 hover:shadow-md"
                  >
                    {/* Brand SVG — sized so it reads at-a-glance even
                        on mobile, but doesn't dominate the card. */}
                    <div className="grid h-12 w-12 place-items-center">
                      <Icon className="h-full w-full" />
                    </div>
                    <div className="text-[12px] font-semibold tracking-tight text-[color:var(--color-navy)]">
                      {name}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
