"use client";

import { useEffect, useState } from "react";

type ConfettiBurstProps = {
  active: boolean;
};

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), 1800);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-sm opacity-80 motion-safe:animate-[confetti-fall_1.4s_ease-out_forwards]"
          style={{
            left: `${8 + (i * 3.7) % 84}%`,
            top: "-8px",
            backgroundColor:
              i % 3 === 0
                ? "hsl(var(--primary))"
                : i % 3 === 1
                  ? "hsl(var(--foreground) / 0.35)"
                  : "hsl(var(--muted-foreground) / 0.5)",
            animationDelay: `${(i % 8) * 60}ms`,
            transform: `rotate(${i * 24}deg)`,
          }}
        />
      ))}
    </div>
  );
}
