"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Check,
  Sparkles,
  ChevronLeft,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "m90_member";
const DISMISSED_KEY = "m90_popup_dismissed";
const APPEAR_DELAY_MS = 15000;

type Member = {
  name: string;
  whatsapp: string;
  team?: string;
  player?: string;
  size?: string;
  createdAt: string;
  purchases: number;
};

type Step = "collapsed" | "step1" | "step2" | "success";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export function JoinPopup() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("collapsed");
  const [member, setMember] = useState<Member | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [size, setSize] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    let timer: number | undefined;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMember(JSON.parse(stored) as Member);
        timer = window.setTimeout(() => setVisible(true), 1800);
        return () => window.clearTimeout(timer);
      }
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === "1") return;
      timer = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    } catch {
      // localStorage unavailable — fail silently
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (step === "collapsed") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setStep("collapsed");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!mounted || !visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  function validateStep1() {
    if (name.trim().length < 2) {
      setError("Escribe tu nombre completo.");
      return false;
    }
    const digits = whatsapp.replace(/\D/g, "");
    if (!/^(53)?5\d{7}$/.test(digits)) {
      setError("Número inválido. Ej: 5XXXXXXX");
      return false;
    }
    setError("");
    return true;
  }

  function goStep2() {
    if (!validateStep1()) return;
    setStep("step2");
  }

  function persistMember(includeOptional: boolean) {
    const m: Member = {
      name: name.trim(),
      whatsapp: whatsapp.replace(/\D/g, ""),
      team: includeOptional && team.trim() ? team.trim() : undefined,
      player: includeOptional && player.trim() ? player.trim() : undefined,
      size: includeOptional && size ? size : undefined,
      createdAt: new Date().toISOString(),
      purchases: 0,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } catch {}
    setMember(m);
    setStep("success");
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-[calc(100vw-2.5rem)] md:bottom-8 md:left-8">
      <AnimatePresence mode="wait">
        {step === "collapsed" ? (
          member ? (
            <MemberChip
              key="chip"
              member={member}
              onOpen={() => {
                setName(member.name);
                setWhatsapp(member.whatsapp);
                setTeam(member.team ?? "");
                setPlayer(member.player ?? "");
                setSize(member.size ?? "");
                setStep("success");
              }}
              onDismiss={() => setVisible(false)}
            />
          ) : (
            <CollapsedBubble
              key="bubble"
              onOpen={() => setStep("step1")}
              onDismiss={dismiss}
            />
          )
        ) : step === "success" ? (
          <SuccessCard
            key="success"
            member={member}
            onClose={() => setStep("collapsed")}
          />
        ) : (
          <FormCard
            key={step}
            step={step}
            values={{ name, whatsapp, team, player, size }}
            error={error}
            onChange={{ setName, setWhatsapp, setTeam, setPlayer, setSize }}
            onBack={() => setStep("step1")}
            onNext={goStep2}
            onFinish={() => persistMember(true)}
            onSkip={() => persistMember(false)}
            onClose={() => setStep("collapsed")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Collapsed bubble ------------------------------- */

function CollapsedBubble({
  onOpen,
  onDismiss,
}: {
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <button
        onClick={onDismiss}
        className="absolute -right-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[color:var(--color-navy-900)] text-[color:var(--color-cream)]/70 transition-all hover:scale-110 hover:text-[color:var(--color-cream)]"
        aria-label="Descartar"
      >
        <X size={12} />
      </button>
      <button
        onClick={onOpen}
        className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-[color:var(--color-navy)] py-3 pl-4 pr-5 text-left text-[color:var(--color-cream)] shadow-[0_20px_50px_-15px_rgba(1,27,83,0.6)] ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[color:var(--color-red)] to-[color:var(--color-red-bright)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-red)] text-white ring-1 ring-white/20">
          <Sparkles size={15} />
        </span>
        <span className="relative">
          <span className="block font-display text-sm italic leading-none">
            Súmate al equipo
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/70 transition-colors group-hover:text-white">
            Descuentos exclusivos
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* ------------------------------- Member chip (already joined) ------------------------------- */

function MemberChip({
  member,
  onOpen,
  onDismiss,
}: {
  member: Member;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const firstName = member.name.split(" ")[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <button
        onClick={onDismiss}
        className="absolute -right-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[color:var(--color-navy-900)] text-[color:var(--color-cream)]/70 transition-all hover:scale-110 hover:text-[color:var(--color-cream)]"
        aria-label="Ocultar"
      >
        <X size={12} />
      </button>
      <button
        onClick={onOpen}
        className="group flex items-center gap-3 rounded-full bg-[color:var(--color-navy)] py-2.5 pl-3 pr-5 text-[color:var(--color-cream)] shadow-[0_20px_50px_-15px_rgba(1,27,83,0.6)] ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
      >
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-red)] font-display text-lg italic text-white ring-1 ring-white/20">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/60">
            Miembro M90
          </span>
          <span className="mt-0.5 flex items-center gap-2 font-display italic leading-none">
            {firstName}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono not-italic tracking-wide text-[color:var(--color-cream)]/80">
              <ShoppingBag size={10} />
              {member.purchases}
            </span>
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* ------------------------------- Form card (step 1 + step 2) ------------------------------- */

function FormCard({
  step,
  values,
  error,
  onChange,
  onBack,
  onNext,
  onFinish,
  onSkip,
  onClose,
}: {
  step: "step1" | "step2";
  values: {
    name: string;
    whatsapp: string;
    team: string;
    player: string;
    size: string;
  };
  error: string;
  onChange: {
    setName: (v: string) => void;
    setWhatsapp: (v: string) => void;
    setTeam: (v: string) => void;
    setPlayer: (v: string) => void;
    setSize: (v: string) => void;
  };
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="Súmate al equipo de M90"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-[min(380px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-[color:var(--color-navy)] text-[color:var(--color-cream)] shadow-[0_30px_70px_-20px_rgba(1,27,83,0.7)] ring-1 ring-white/10"
    >
      {/* Accent gradient bar */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[color:var(--color-red)] via-[color:var(--color-cream)] to-[color:var(--color-red)]"
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="group absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/5 text-[color:var(--color-cream)]/70 ring-1 ring-white/10 transition-all hover:bg-[color:var(--color-red)] hover:text-white"
        aria-label="Cerrar"
      >
        <X
          size={13}
          className="transition-transform duration-300 group-hover:rotate-90"
        />
      </button>

      <div className="px-5 pb-5 pt-6 md:px-6 md:pb-6 md:pt-7">
        {step === "step1" ? (
          <>
            <div className="mb-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-red-bright)]">
              <Sparkles size={11} />
              Paso 1 de 2
            </div>
            <h3 className="font-display text-2xl italic leading-[0.95] md:text-[26px]">
              Súmate al equipo
              <br />
              de M90
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-cream)]/65">
              Descuentos exclusivos, acceso anticipado a ediciones limitadas y
              envío prioritario.
            </p>

            <div className="mt-5 space-y-3">
              <Field
                label="Nombre completo"
                required
                placeholder="Tu nombre"
                value={values.name}
                onChange={onChange.setName}
                autoComplete="name"
                maxLength={60}
              />
              <Field
                label="WhatsApp"
                required
                placeholder="+53 5XXXXXXX"
                value={values.whatsapp}
                onChange={onChange.setWhatsapp}
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
              />
            </div>

            <AnimatePresence>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 text-[11px] font-medium text-[color:var(--color-red-bright)]"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <button
              onClick={onNext}
              className="group mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[color:var(--color-red)] px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5"
            >
              <span className="relative">Continuar</span>
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <p className="mt-3 text-center text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-cream)]/40">
              Tus datos quedan solo en tu dispositivo
            </p>
          </>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-red-bright)]">
                <Sparkles size={11} />
                Paso 2 de 2
              </span>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/60 transition-colors hover:text-[color:var(--color-cream)]"
                aria-label="Volver al paso anterior"
              >
                <ChevronLeft size={12} />
                Atrás
              </button>
            </div>
            <h3 className="font-display text-2xl italic leading-[0.95] md:text-[26px]">
              Personaliza
              <br />
              tu perfil
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-cream)]/65">
              Opcional — nos ayuda a mostrarte camisetas que te gusten.
            </p>

            <div className="mt-5 space-y-3">
              <Field
                label="Equipo favorito"
                placeholder="Real Madrid, Barcelona, Lakers..."
                value={values.team}
                onChange={onChange.setTeam}
                maxLength={50}
              />
              <Field
                label="Jugador favorito"
                placeholder="Messi, Kobe, Del Piero..."
                value={values.player}
                onChange={onChange.setPlayer}
                maxLength={50}
              />

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/60">
                  Talla habitual
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        onChange.setSize(values.size === s ? "" : s)
                      }
                      className={cn(
                        "grid h-9 min-w-[44px] place-items-center rounded-full px-3 text-[11px] font-bold tracking-wider transition-all",
                        values.size === s
                          ? "bg-[color:var(--color-cream)] text-[color:var(--color-navy)] ring-2 ring-[color:var(--color-cream)]"
                          : "bg-white/5 text-[color:var(--color-cream)]/70 ring-1 ring-white/10 hover:bg-white/10",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={onSkip}
                className="flex-1 rounded-full border border-white/15 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/70 transition-colors hover:border-white/30 hover:text-[color:var(--color-cream)]"
              >
                Saltar
              </button>
              <button
                onClick={onFinish}
                className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--color-red)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5"
              >
                Finalizar
                <Check size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------- Success ------------------------------- */

function SuccessCard({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  const firstName = member?.name.split(" ")[0] ?? "crack";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-[min(340px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-[color:var(--color-navy)] text-[color:var(--color-cream)] shadow-[0_30px_70px_-20px_rgba(1,27,83,0.7)] ring-1 ring-white/10"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[color:var(--color-red)] via-[color:var(--color-cream)] to-[color:var(--color-red)]"
      />
      <button
        onClick={onClose}
        className="group absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/5 text-[color:var(--color-cream)]/70 ring-1 ring-white/10 transition-all hover:bg-[color:var(--color-red)] hover:text-white"
        aria-label="Cerrar"
      >
        <X
          size={13}
          className="transition-transform duration-300 group-hover:rotate-90"
        />
      </button>

      <div className="px-6 pb-6 pt-7 text-center">
        <motion.div
          initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            delay: 0.05,
          }}
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-red)] text-white ring-4 ring-[color:var(--color-red)]/20"
        >
          <Check size={26} strokeWidth={3} />
        </motion.div>
        <h3 className="mt-4 font-display text-2xl italic leading-[0.95]">
          ¡Bienvenido,
          <br />
          {firstName}!
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--color-cream)]/65">
          Ya eres parte del equipo. Te avisaremos por WhatsApp cuando lleguen
          ediciones que te interesen.
        </p>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/60">
            Compras realizadas
          </span>
          <span className="font-display text-2xl italic leading-none text-[color:var(--color-cream)]">
            {member?.purchases ?? 0}
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-white/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-cream)]/80 ring-1 ring-white/15 transition-colors hover:bg-white/15 hover:text-white"
        >
          Seguir explorando
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------- Field ------------------------------- */

function Field({
  label,
  required,
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)]/60">
        {label}
        {required ? (
          <span className="text-[color:var(--color-red-bright)]">*</span>
        ) : null}
      </span>
      <input
        type="text"
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[color:var(--color-cream)] placeholder:text-[color:var(--color-cream)]/30 focus:border-[color:var(--color-red)] focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-red)]/30"
      />
    </label>
  );
}
