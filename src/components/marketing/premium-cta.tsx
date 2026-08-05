import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PremiumCtaProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  showArrow?: boolean;
  onClick?: () => void;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden
    >
      <path
        d="M4 12L12 4M12 4H6M12 4V10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PremiumCta({
  href,
  children,
  variant = "primary",
  className,
  showArrow = true,
  onClick,
}: PremiumCtaProps) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
        "motion-safe:transition-[transform,background-color,color,box-shadow] motion-safe:duration-500 motion-safe:ease-premium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.98]",
        isPrimary
          ? "bg-primary text-primary-foreground shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.55)] hover:bg-primary/92"
          : "bg-secondary/80 text-secondary-foreground ring-1 ring-border/60 hover:bg-secondary",
        className,
      )}
    >
      <span>{children}</span>
      {showArrow ? (
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-premium",
            "group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
            isPrimary
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-foreground/5 text-foreground",
          )}
        >
          <ArrowIcon />
        </span>
      ) : null}
    </Link>
  );
}
