"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, Video, MoreVertical, Check } from "lucide-react";
import { Typewriter } from "./ui/typewriter";
import { asset, whatsappUrl } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type Bubble =
  | { from: "client"; text: string }
  | { from: "m90"; text: string; typewriter?: boolean };

interface Conversation {
  time: string;
  bubbles: Bubble[];
}

/**
 * Conversaciones reales que cualquier cliente cubano habría tenido con M90.
 * Rotan cada ~9s para que quien vuelve a scrollear vea algo distinto.
 */
const CONVERSATIONS: Conversation[] = [
  {
    time: "Hoy 11:29",
    bubbles: [
      { from: "client", text: "Buenas, quiero la Real Madrid visitante 25/26" },
      { from: "m90", text: "¿Qué talla, brother?" },
      { from: "client", text: "L" },
      {
        from: "m90",
        text: "La tengo. $45 + envío 24h en La Habana.",
        typewriter: true,
      },
    ],
  },
  {
    time: "Hoy 09:14",
    bubbles: [
      { from: "client", text: "Hola, tienen la Barcelona local?" },
      { from: "m90", text: "Sí. ¿Talla y provincia?" },
      { from: "client", text: "M, Villa Clara" },
      {
        from: "m90",
        text: "$45 + $8 mensajería. Te llega en 3 días.",
        typewriter: true,
      },
    ],
  },
  {
    time: "Hoy 18:02",
    bubbles: [
      { from: "client", text: "¿Puedo pagar por Transfermóvil?" },
      { from: "m90", text: "Claro, o MLC si prefieres." },
      { from: "client", text: "Transferencia enviada" },
      {
        from: "m90",
        text: "Confirmado. Sale hoy por mensajería.",
        typewriter: true,
      },
    ],
  },
  {
    time: "Hoy 14:48",
    bubbles: [
      { from: "client", text: "Tienen la Brasil 98 Ronaldo R9?" },
      { from: "m90", text: "Edición retro, sí." },
      { from: "client", text: "Mándame foto real" },
      {
        from: "m90",
        text: "Va foto en 2 min. Todas las tallas.",
        typewriter: true,
      },
    ],
  },
];

const DISPLAY_MS = 9000;

export function ChatCard() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reduced = useMemo(() => {
    if (!mounted || typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, [mounted]);

  useEffect(() => {
    if (!mounted || reduced) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % CONVERSATIONS.length),
      DISPLAY_MS,
    );
    return () => clearInterval(id);
  }, [mounted, reduced]);

  const convo = CONVERSATIONS[index];

  return (
    <a
      href={whatsappUrl("Hola M90, quiero hacer un pedido.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir conversación de WhatsApp con M90"
      className="group relative block w-full max-w-[420px] overflow-hidden rounded-[22px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-transform hover:-translate-y-1"
    >
      {/* WhatsApp dark header */}
      <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3 md:px-5">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--color-red)] ring-2 ring-[#202c33]">
          <img
            src={asset("/brand/m90-cream.png")}
            alt=""
            draggable={false}
            className="h-5 w-auto select-none"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[14px] font-semibold text-white">
            M90 Sports
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#8696a0]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#25d366]" />
            en línea
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#aebac1]">
          <Video size={18} strokeWidth={1.75} />
          <Phone size={17} strokeWidth={1.75} />
          <MoreVertical size={18} strokeWidth={1.75} />
        </div>
      </div>

      {/* Chat area with WhatsApp dark background (doodle pattern via SVG) */}
      <div
        className="relative min-h-[290px] px-3 py-4 md:px-4 md:py-5"
        style={{
          background: "#0b141a",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='%23182229' fill-opacity='0.4'><circle cx='20' cy='20' r='1.2'/><circle cx='60' cy='40' r='1.2'/><circle cx='30' cy='60' r='1.2'/><circle cx='70' cy='10' r='1.2'/><circle cx='10' cy='70' r='1.2'/></g></svg>")`,
        }}
      >
        {/* Date separator */}
        <div className="mb-3 flex items-center justify-center">
          <span className="rounded-md bg-[#1d282f] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8696a0]">
            {convo.time}
          </span>
        </div>

        {/* Bubbles — AnimatePresence swaps the whole convo on rotation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease }}
            className="flex flex-col gap-1.5"
          >
            {convo.bubbles.map((b, i) => (
              <ChatBubble key={i} bubble={b} index={i} reduced={reduced} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* WhatsApp input area (non-functional, decorative + CTA) */}
      <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2.5">
        <div className="flex h-10 flex-1 items-center rounded-full bg-[#2a3942] px-4 text-[12px] text-[#8696a0]">
          Escribir a M90…
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white transition-transform group-hover:scale-110">
          <MessageCircle size={18} fill="currentColor" />
        </span>
      </div>

      {/* Subtle hover glow to signal clickability */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-[#25d366]/0 transition-all duration-500 group-hover:ring-[#25d366]/30"
      />
    </a>
  );
}

function ChatBubble({
  bubble,
  index,
  reduced,
}: {
  bubble: Bubble;
  index: number;
  reduced: boolean;
}) {
  const isClient = bubble.from === "client";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease,
        delay: reduced ? 0 : 0.2 + index * 0.45,
      }}
      className={`flex ${isClient ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[78%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug shadow-[0_1px_0_rgba(11,20,26,0.13)] md:text-sm ${
          isClient
            ? "rounded-tr-[4px] bg-[#005c4b] text-white"
            : "rounded-tl-[4px] bg-[#202c33] text-white"
        }`}
      >
        <p className="pr-12">
          {bubble.from === "m90" && bubble.typewriter ? (
            <Typewriter
              text={bubble.text}
              charInterval={30}
              startDelay={reduced ? 0 : 1400 + (index - 1) * 450}
              reduced={reduced}
              cursor={false}
            />
          ) : (
            bubble.text
          )}
        </p>
        <span
          className={`absolute bottom-1 right-2 inline-flex items-center gap-0.5 text-[10px] ${
            isClient ? "text-[#8cbdb3]" : "text-[#8696a0]"
          }`}
        >
          {timeFrom(index)}
          {isClient ? (
            <span className="relative inline-flex">
              <Check
                size={12}
                strokeWidth={2.2}
                className="text-[#53bdeb]"
              />
              <Check
                size={12}
                strokeWidth={2.2}
                className="-ml-2 text-[#53bdeb]"
              />
            </span>
          ) : null}
        </span>
      </div>
    </motion.div>
  );
}

// Fake ascending timestamps so the convo feels like it happened over a minute.
function timeFrom(i: number) {
  const base = 11 * 60 + 29;
  const m = base + i;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
