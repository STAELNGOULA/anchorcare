import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type BezelCardProps = {
  children: ReactNode;
  className?: string;
  /** @deprecated Merged into className — single-layer cards only */
  innerClassName?: string;
} & Pick<ComponentProps<"div">, "aria-label">;

export function BezelCard({
  children,
  className,
  innerClassName,
  "aria-label": ariaLabel,
}: BezelCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] bg-card ring-1 ring-border/50 shadow-soft",
        className,
        innerClassName,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
