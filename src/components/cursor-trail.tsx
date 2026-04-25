"use client";

import { useEffect, useRef, useState } from "react";

type TrailItem = {
  id: number;
  x: number;
  y: number;
  src: string;
  rot: number;
};

type Props = {
  images: string[];
  /** Minimum px the cursor must travel before dropping the next image. */
  minDistance?: number;
  /** How long each trail image stays visible (ms). */
  lifetime?: number;
  /** Max concurrent trail images. */
  cap?: number;
  /** Target ref of the section that should capture the mouse. */
  targetRef?: React.RefObject<HTMLElement | null>;
};

/**
 * Image-trail cursor effect (à la ashleybrookecs.com): as the mouse moves
 * across the target, tiny photos drop at the cursor, rotate slightly, fade
 * out and cycle through the given array.
 */
export function CursorTrail({
  images,
  minDistance = 90,
  lifetime = 1200,
  cap = 6,
  targetRef,
}: Props) {
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const lastPos = useRef({ x: -9999, y: -9999 });
  const idxRef = useRef(0);
  const nextId = useRef(0);

  useEffect(() => {
    const el = targetRef?.current ?? document.body;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      if (Math.hypot(dx, dy) < minDistance) return;
      lastPos.current = { x: e.clientX, y: e.clientY };

      const id = nextId.current++;
      const src = images[idxRef.current % images.length];
      idxRef.current++;
      const rot = (Math.random() - 0.5) * 24;

      setTrail((prev) => {
        const next = [...prev, { id, x: e.clientX, y: e.clientY, src, rot }];
        return next.slice(-cap);
      });

      window.setTimeout(() => {
        setTrail((prev) => prev.filter((t) => t.id !== id));
      }, lifetime);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [images, minDistance, lifetime, cap, targetRef]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      style={{ mixBlendMode: "normal" }}
    >
      {trail.map((t) => (
        <img
          key={t.id}
          src={t.src}
          alt=""
          style={{
            position: "fixed",
            left: t.x,
            top: t.y,
            transform: `translate(-50%, -50%) rotate(${t.rot}deg)`,
            width: "clamp(160px, 18vw, 300px)",
            aspectRatio: "3/4",
            objectFit: "cover",
            borderRadius: 12,
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.55)",
            animation: `trailPop ${lifetime}ms cubic-bezier(.22,1,.36,1) forwards`,
            willChange: "transform, opacity",
          }}
        />
      ))}
      <style>{`
        @keyframes trailPop {
          0%   { opacity: 0; scale: 0.7; }
          18%  { opacity: 1; scale: 1; }
          70%  { opacity: 1; scale: 1; }
          100% { opacity: 0; scale: 0.98; }
        }
      `}</style>
    </div>
  );
}
