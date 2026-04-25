"use client";

import { motion } from "framer-motion";
import { MessageCircle, Search, Wallet, Truck } from "lucide-react";
import { whatsappUrl } from "@/lib/utils";
import AnimatedTextCycle from "./ui/animated-text-cycle";

const GIFT_TARGETS = [
  "ti mismo",
  "tu pareja",
  "tu novia",
  "tu novio",
  "tu hijo",
  "tu hija",
  "un amigo",
  "tu viejo",
  "tu equipo",
];

const STEPS = [
  {
    icon: <Search size={20} />,
    title: "Elige tu camiseta",
    desc: "Mira nuestro catálogo o dinos qué equipo quieres. Tenemos acceso a más de 500 modelos.",
    kicker: "Paso 01",
  },
  {
    icon: <MessageCircle size={20} />,
    title: "Escríbenos por WhatsApp",
    desc: "Confirmamos disponibilidad, talla y color. Te enviamos fotos reales antes de pagar.",
    kicker: "Paso 02",
  },
  {
    icon: <Wallet size={20} />,
    title: "Paga como prefieras",
    desc: "Transfermóvil, MLC, o CUP/USD en efectivo. El que te venga mejor.",
    kicker: "Paso 03",
  },
  {
    icon: <Truck size={20} />,
    title: "Recibe en tu puerta",
    desc: "Envío en 24–48h en La Habana. Resto de provincias 3–5 días por mensajería.",
    kicker: "Paso 04",
  },
];

export function HowToBuy() {
  return (
    <section
      id="como-comprar"
      className="relative overflow-hidden bg-[color:var(--color-cream)] py-24 text-[color:var(--color-navy)] md:py-32"
    >
      {/* Big diagonal number behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 font-display text-[360px] italic leading-none text-[color:var(--color-navy)]/[0.04] md:text-[520px]"
      >
        90
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-red)]">
            <span className="h-px w-10 bg-[color:var(--color-red)]" />
            Cómo comprar
          </div>
          <h2 className="mt-4 font-display text-5xl italic md:text-7xl">
            Nos escribes.
            <br />
            Te llega.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--color-navy)]/70">
            Todo por WhatsApp, con una persona real. Llevamos así desde 2020.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.kicker}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-[color:var(--color-navy)]/10 bg-white/60 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-[color:var(--color-red)]/40 hover:shadow-[0_20px_50px_-24px_rgba(152,14,33,0.4)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--color-navy)] text-[color:var(--color-cream)]">
                    {s.icon}
                  </span>
                  <span className="font-display text-xl italic text-[color:var(--color-red)]">
                    {s.kicker}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-3xl italic">{s.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-navy)]/70">
                {s.desc}
              </p>
              <span className="absolute bottom-5 right-5 text-lg font-bold text-[color:var(--color-navy)]/20 transition-colors group-hover:text-[color:var(--color-red)]">
                →
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 flex flex-col items-center gap-5 rounded-3xl border border-[color:var(--color-navy)]/10 bg-[color:var(--color-navy)] p-8 text-[color:var(--color-cream)] md:flex-row md:justify-between"
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--color-cream)]/60">
              ¿Ya decidiste?
            </div>
            <h3 className="mt-1 font-display text-3xl italic leading-[1.1] md:text-4xl">
              Dale un gusto a{" "}
              <AnimatedTextCycle
                words={GIFT_TARGETS}
                interval={2400}
                className="font-display italic text-[color:var(--color-red-bright)]"
              />
            </h3>
          </div>
          <a
            href={whatsappUrl("Hola M90, quiero hacer un pedido.")}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-[color:var(--color-red)] px-7 py-4 text-sm font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02]"
          >
            <MessageCircle size={16} />
            Abrir WhatsApp
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
