import Link from "next/link";
import type { ReactNode } from "react";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { marketingContainer } from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function AuthShell({
  children,
  title,
  subtitle,
  backHref = "/",
  backLabel,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background py-10 md:py-14">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle variant="pill" />
      </div>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={cn(marketingContainer, "relative z-10 w-full", className)}>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-6 text-center">
            <Link
              href="/"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AnchorLogo />
            </Link>
            <div className="space-y-2">
              <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-base leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 shadow-soft md:p-8">
            {children}
          </div>

          {backLabel ? (
            <p className="mt-6 text-center">
              <Link
                href={backHref}
                className="text-sm font-medium text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
              >
                {backLabel}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
