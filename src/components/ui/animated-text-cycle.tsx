"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedTextCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

export default function AnimatedTextCycle({
  words,
  interval = 3000,
  className = "",
}: AnimatedTextCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState<string>("auto");
  const measureRef = useRef<HTMLDivElement>(null);

  // Measure the current word to drive the container width animation.
  useEffect(() => {
    if (!measureRef.current) return;
    const el = measureRef.current.children[currentIndex] as
      | HTMLElement
      | undefined;
    if (!el) return;
    setWidth(`${el.getBoundingClientRect().width}px`);
  }, [currentIndex]);

  // Re-measure on window resize so responsive font-sizes stay in sync.
  useEffect(() => {
    function onResize() {
      if (!measureRef.current) return;
      const el = measureRef.current.children[currentIndex] as
        | HTMLElement
        | undefined;
      if (el) setWidth(`${el.getBoundingClientRect().width}px`);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, words.length]);

  const variants: import("framer-motion").Variants = {
    hidden: { y: -20, opacity: 0, filter: "blur(8px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      y: 20,
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    },
  };

  return (
    <>
      {/* Hidden measurement node — mirrors every word at the same size so
          we can read their widths and animate the container smoothly. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0"
        style={{ visibility: "hidden" }}
      >
        {words.map((word, i) => (
          <span key={i} className={className}>
            {word}
          </span>
        ))}
      </div>

      {/* Visible animated word */}
      <motion.span
        className="relative inline-block align-baseline"
        animate={{
          width,
          transition: {
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 1.2,
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentIndex}
            className={`inline-block ${className}`}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ whiteSpace: "nowrap" }}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
}
