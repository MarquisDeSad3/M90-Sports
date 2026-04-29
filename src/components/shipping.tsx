"use client";

import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Clock, Banknote } from "lucide-react";
import { asset } from "@/lib/utils";
import type { PublicShippingZone } from "@/lib/queries/public-shipping";

const PAYMENTS = [
  { name: "Transfermóvil", icon: "TM" },
  { name: "Zelle", icon: "Z" },
  { name: "PayPal", icon: "PP" },
  { name: "Efectivo", icon: "$" },
];

interface ShippingProps {
  zones: PublicShippingZone[];
}

export function Shipping({ zones }: ShippingProps) {
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
              Mensajería propia en La Habana. Para el resto de provincias
              usamos operadores con seguimiento real. Sin promesas vacías.
            </p>

            {zones.length === 0 ? (
              <p className="mt-10 rounded-xl border border-dashed border-[color:var(--color-navy)]/20 bg-white/40 p-6 text-sm text-[color:var(--color-navy)]/65">
                Todavía no configuramos las zonas de envío. Escríbenos por
                WhatsApp y te confirmamos la entrega para tu provincia.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {zones.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.02, duration: 0.4 }}
                    className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                      p.highlight
                        ? "border-[color:var(--color-red)] bg-[color:var(--color-red)] text-white"
                        : "border-[color:var(--color-navy)]/10 bg-white/60 text-[color:var(--color-navy)] hover:border-[color:var(--color-navy)]/40"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <MapPin size={12} />
                      {p.name}
                    </span>
                    <span
                      className={`font-display text-lg italic ${
                        p.highlight
                          ? "text-[color:var(--color-cream)]"
                          : "text-[color:var(--color-red)]"
                      }`}
                    >
                      {p.daysLabel}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
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
                {PAYMENTS.map((p) => (
                  <div
                    key={p.name}
                    className="group flex aspect-square flex-col items-center justify-center rounded-xl border border-[color:var(--color-navy)]/10 bg-white p-3 text-center transition-colors hover:border-[color:var(--color-red)]/50"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-navy)] font-display text-lg italic text-[color:var(--color-cream)]">
                      {p.icon}
                    </div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-navy)]">
                      {p.name}
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
