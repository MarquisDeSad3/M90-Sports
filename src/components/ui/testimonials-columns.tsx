"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomerAvatar } from "@/components/admin/customer-avatar"

export interface TestimonialItem {
  id: string
  name: string
  role?: string
  city?: string
  country?: string
  body: string
  rating?: number
  photoUrl?: string
}

interface TestimonialsColumnProps {
  className?: string
  testimonials: TestimonialItem[]
  duration?: number
}

export function TestimonialsColumn({
  className,
  testimonials,
  duration = 18,
}: TestimonialsColumnProps) {
  return (
    <div className={cn(className)}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {testimonials.map((t) => (
              <article
                key={`${dup}-${t.id}`}
                className="w-full max-w-xs rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* Stars */}
                {typeof t.rating === "number" && (
                  <div className="mb-3 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "size-3.5",
                          n <= t.rating!
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Body */}
                <p className="text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.body}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.name}
                      width={40}
                      height={40}
                      loading="lazy"
                      className="size-10 rounded-full object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <CustomerAvatar name={t.name} size="lg" />
                  )}
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold tracking-tight">
                      {t.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t.city ? `${t.city}` : t.role ?? ""}
                      {t.city && t.country ? ` · ${t.country}` : t.country ?? ""}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  )
}
