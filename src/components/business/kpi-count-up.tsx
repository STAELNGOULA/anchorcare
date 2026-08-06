"use client";

import { useEffect, useRef, useState } from "react";

type KpiCountUpProps = {
  value: number;
  suffix?: string;
  durationMs?: number;
};

export function KpiCountUp({
  value,
  suffix = "",
  durationMs = 600,
}: KpiCountUpProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current == null) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}
