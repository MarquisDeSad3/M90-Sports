"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  MessageCircle,
  ArrowUpRight,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { asset, whatsappUrl } from "@/lib/utils";

export function CartDrawer() {
  const { state, dispatch, count, total } = useCart();
  const { items, open } = state;

  function buildMessage() {
    const lines: string[] = [];
    lines.push("Hola M90, quiero hacer un pedido:");
    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━");
    items.forEach((i, idx) => {
      lines.push(`${idx + 1}. ${i.team} — ${i.name}`);
      lines.push(
        `   Talla ${i.size} · Cantidad ${i.qty} · $${i.price * i.qty} USD`,
      );
      if (i.photo) lines.push(`   ${i.photo}`);
      lines.push("");
    });
    lines.push("━━━━━━━━━━━━━━━━━━━");
    lines.push(`TOTAL: $${total} USD (${count} ${count === 1 ? "camiseta" : "camisetas"})`);
    lines.push("");
    lines.push("¿Cómo coordinamos el envío?");
    return lines.join("\n");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70]"
        >
          <motion.button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => dispatch({ type: "CLOSE" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Cerrar carrito"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-[color:var(--color-cream-soft)] text-[color:var(--color-navy)] shadow-[-24px_0_60px_-20px_rgba(1,27,83,0.4)]"
          >
            {/* Pattern bg */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url(${asset("/patterns/m90-pattern-navy.webp")})`,
                backgroundSize: "340px auto",
              }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-[color:var(--color-navy)]/10 px-5 py-4 md:px-6">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-red)]">
                  <ShoppingBag size={12} />
                  Tu pedido
                </div>
                <div className="mt-1 font-display text-2xl italic leading-tight md:text-3xl">
                  {count > 0
                    ? `${count} ${count === 1 ? "camiseta" : "camisetas"}`
                    : "Vacío por ahora"}
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "CLOSE" })}
                className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-navy)]/15 transition-colors hover:bg-[color:var(--color-navy)] hover:text-[color:var(--color-cream)]"
                aria-label="Cerrar"
              >
                <X
                  size={18}
                  className="transition-transform duration-500 group-hover:rotate-90"
                />
              </button>
            </div>

            {/* Items list */}
            <div className="relative flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <EmptyState onClose={() => dispatch({ type: "CLOSE" })} />
              ) : (
                <ul className="divide-y divide-[color:var(--color-navy)]/10 px-5 md:px-6">
                  {items.map((i) => (
                    <CartLine key={i.id + i.size} item={i} />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="relative border-t border-[color:var(--color-navy)]/10 bg-[color:var(--color-cream-soft)]/90 px-5 pb-6 pt-4 backdrop-blur md:px-6">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-navy)]/60">
                    Total
                  </span>
                  <span className="font-display text-4xl italic text-[color:var(--color-red)]">
                    ${total}
                    <span className="ml-1 text-sm tracking-widest text-[color:var(--color-navy)]/60">
                      USD
                    </span>
                  </span>
                </div>
                <p className="mb-4 text-[11px] leading-relaxed text-[color:var(--color-navy)]/55">
                  Al pulsar checkout se abre WhatsApp con tu pedido listo —
                  solo confirmas y coordinamos envío.
                </p>
                <a
                  href={whatsappUrl(buildMessage())}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => dispatch({ type: "CLOSE" })}
                  className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-red)] py-4 text-sm font-bold uppercase tracking-wider text-white"
                >
                  <span className="absolute inset-0 -translate-x-full bg-[color:var(--color-navy)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
                  <MessageCircle size={16} className="relative z-10" />
                  <span className="relative z-10">Checkout por WhatsApp</span>
                  <ArrowUpRight
                    size={16}
                    className="relative z-10 transition-transform duration-500 group-hover:rotate-45"
                  />
                </a>
                <button
                  onClick={() => {
                    if (confirm("¿Vaciar el carrito?"))
                      dispatch({ type: "CLEAR" });
                  }}
                  className="mt-3 block w-full text-center text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-navy)]/45 transition-colors hover:text-[color:var(--color-red)]"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------- sub-components -------------------- */

function CartLine({
  item,
}: {
  item: import("@/lib/cart-store").CartItem;
}) {
  const { dispatch } = useCart();
  return (
    <li className="flex gap-4 py-4">
      <div
        className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-navy)]/5"
        style={{
          backgroundImage: item.photo ? `url(${item.photo})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-navy)]/55">
          {item.season}
        </div>
        <div className="truncate font-display text-lg italic leading-tight">
          {item.team}
        </div>
        <div className="truncate text-xs text-[color:var(--color-navy)]/70">
          {item.name} · Talla {item.size}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-[color:var(--color-navy)]/20 bg-white/50">
            <button
              onClick={() =>
                dispatch({
                  type: "QTY",
                  id: item.id,
                  size: item.size,
                  qty: item.qty - 1,
                })
              }
              className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--color-navy)]/70 transition-colors hover:bg-[color:var(--color-navy)]/5 hover:text-[color:var(--color-navy)]"
              aria-label="Menos"
            >
              <Minus size={12} />
            </button>
            <span className="w-5 text-center text-xs font-bold tabular-nums">
              {item.qty}
            </span>
            <button
              onClick={() =>
                dispatch({
                  type: "QTY",
                  id: item.id,
                  size: item.size,
                  qty: item.qty + 1,
                })
              }
              className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--color-navy)]/70 transition-colors hover:bg-[color:var(--color-navy)]/5 hover:text-[color:var(--color-navy)]"
              aria-label="Más"
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            onClick={() =>
              dispatch({ type: "REMOVE", id: item.id, size: item.size })
            }
            className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--color-navy)]/35 transition-colors hover:bg-[color:var(--color-red)]/10 hover:text-[color:var(--color-red)]"
            aria-label="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-xl italic text-[color:var(--color-red)]">
          ${item.price * item.qty}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-[color:var(--color-navy)]/45">
          ${item.price} c/u
        </div>
      </div>
    </li>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-[color:var(--color-navy)]/15 bg-white/40">
        <ShoppingBag size={22} className="text-[color:var(--color-navy)]/60" />
      </div>
      <div>
        <div className="font-display text-3xl italic">Carrito vacío.</div>
        <p className="mt-2 max-w-[260px] text-sm text-[color:var(--color-navy)]/60">
          Agrega camisetas desde el catálogo y las verás aquí listas para
          enviar por WhatsApp.
        </p>
      </div>
      <button
        onClick={onClose}
        className="group mt-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-navy)]/20 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[color:var(--color-navy)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-navy)] hover:bg-[color:var(--color-navy)] hover:text-[color:var(--color-cream)]"
      >
        Explorar catálogo
        <ArrowUpRight
          size={14}
          className="transition-transform duration-500 group-hover:rotate-45"
        />
      </button>
    </div>
  );
}
