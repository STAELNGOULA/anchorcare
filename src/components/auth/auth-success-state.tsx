"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AuthSuccessStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function AuthSuccessState({
  title,
  description,
  className,
}: AuthSuccessStateProps) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn("flex flex-col items-center gap-5 py-2 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" className="opacity-20" />
          <path
            d="M8 12.5l2.5 2.5L16 9"
            style={{
              strokeDasharray: 24,
              strokeDashoffset: drawn ? 0 : 24,
              transition: "stroke-dashoffset 480ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </svg>
      </div>
      <div className="space-y-2">
        <p className="font-display text-xl tracking-tight text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
