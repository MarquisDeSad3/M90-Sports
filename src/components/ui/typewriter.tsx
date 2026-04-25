"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  charInterval?: number;
  startDelay?: number;
  cursor?: boolean;
  className?: string;
  reduced?: boolean;
}

/**
 * Types `text` one character at a time. Resets when `text` changes.
 */
export function Typewriter({
  text,
  charInterval = 38,
  startDelay = 250,
  cursor = true,
  className,
  reduced = false,
}: TypewriterProps) {
  const [display, setDisplay] = useState(reduced ? text : "");

  useEffect(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    setDisplay("");
    let i = 0;
    let iv: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length && iv) clearInterval(iv);
      }, charInterval);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (iv) clearInterval(iv);
    };
  }, [text, charInterval, startDelay, reduced]);

  const typing = display.length < text.length;

  return (
    <span className={className}>
      {display}
      {cursor && typing && (
        <span
          aria-hidden="true"
          className="ml-[2px] inline-block h-[0.95em] w-[2px] animate-pulse bg-current align-text-bottom"
        />
      )}
    </span>
  );
}
