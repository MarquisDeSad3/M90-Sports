"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { asset } from "@/lib/utils";

const HERO_IMAGES = [
  asset("/hero/hero-left.jpg"),
  asset("/hero/hero-center.webp"),
  asset("/hero/hero-right.jpg"),
  asset("/brand/m90-red.png"),
  asset("/brand/m90-navy.png"),
  asset("/brand/m90-cream.png"),
];

export function Preloader() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let done = 0;
    const total = HERO_IMAGES.length;

    const tick = () => {
      if (!mounted) return;
      done += 1;
      setProgress(Math.round((done / total) * 100));
      if (done >= total) {
        // brief pause so the user sees the full bar before it disappears
        window.setTimeout(() => {
          if (mounted) setLoaded(true);
        }, 350);
      }
    };

    HERO_IMAGES.forEach((src) => {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = src;
    });

    // Failsafe: never block longer than 5s even if something is broken
    const failsafe = window.setTimeout(() => {
      if (mounted) setLoaded(true);
    }, 5000);

    return () => {
      mounted = false;
      window.clearTimeout(failsafe);
    };
  }, []);

  // Prevent body scroll while loading
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!loaded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loaded]);

  return (
    <AnimatePresence>
      {!loaded ? (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-white"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.img
              src={asset("/brand/m90-red.png")}
              alt="M90"
              draggable={false}
              animate={{ scale: [1, 1.06, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-12 w-auto select-none md:h-16"
            />
            <div className="relative h-[2px] w-40 overflow-hidden rounded-full bg-[color:var(--color-navy)]/10">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[color:var(--color-red)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-navy)]/50">
              {progress.toString().padStart(2, "0")}%
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
