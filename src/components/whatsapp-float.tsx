"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { whatsappUrl } from "@/lib/utils";

export function WhatsappFloat() {
  const [show, setShow] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 900);
    const tip = setTimeout(() => setShowTip(true), 2600);
    const hide = setTimeout(() => setShowTip(false), 9000);
    return () => {
      clearTimeout(t);
      clearTimeout(tip);
      clearTimeout(hide);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-end gap-3 md:bottom-8 md:right-8">
      <AnimatePresence>
        {showTip ? (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-[240px] rounded-2xl bg-white p-4 text-sm text-[color:var(--color-navy)] shadow-[0_20px_60px_-20px_rgba(1,27,83,0.4)]"
          >
            <button
              onClick={() => setShowTip(false)}
              className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-white"
              aria-label="Cerrar"
            >
              <X size={12} />
            </button>
            <div className="font-display text-lg italic text-[color:var(--color-red)]">
              ¡Hola!
            </div>
            <p className="mt-1 leading-snug">
              ¿Buscas alguna camiseta en especial? Pregunta sin compromiso.
            </p>
            <div className="absolute -right-1 bottom-4 h-3 w-3 rotate-45 bg-white" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.a
        initial={{ opacity: 0, scale: 0.5, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        href={whatsappUrl("Hola M90, quiero más info.")}
        target="_blank"
        rel="noreferrer"
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-red)] text-white shadow-[0_20px_50px_-10px_rgba(152,14,33,0.6)] transition-transform hover:scale-110"
        aria-label="Abrir WhatsApp"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[color:var(--color-red)] opacity-30" />
        <MessageCircle size={24} />
      </motion.a>
    </div>
  );
}
