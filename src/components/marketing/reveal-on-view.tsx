"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  id?: string;
};

export function RevealOnView({
  children,
  className,
  delayMs = 0,
  id,
}: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        "motion-safe:transition-[transform,opacity,filter] motion-safe:duration-700 motion-safe:ease-premium",
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "motion-safe:translate-y-8 motion-safe:opacity-0 motion-safe:blur-[2px]",
        className,
      )}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
