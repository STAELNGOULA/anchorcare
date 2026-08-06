import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  topBar?: ReactNode;
  sidebar?: ReactNode;
  mobileNav?: ReactNode;
  className?: string;
  mainClassName?: string;
  contentId?: string;
};

/**
 * Shared application chrome — role portals compose nav/topBar slots.
 */
export function AppShell({
  children,
  topBar,
  sidebar,
  mobileNav,
  className,
  mainClassName,
  contentId = "main-content",
}: AppShellProps) {
  return (
    <div className={cn("relative min-h-[100dvh] bg-background", className)}>
      <div
        className="grain-overlay pointer-events-none fixed inset-0 z-0"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 md:px-6 md:pb-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
          {topBar ? (
            <div className="min-w-0 lg:col-span-2">{topBar}</div>
          ) : null}
          {sidebar ? (
            <aside className="hidden lg:block" aria-label="Primary navigation">
              {sidebar}
            </aside>
          ) : null}
          <main id={contentId} className={cn("min-w-0", mainClassName)}>
            {children}
          </main>
        </div>
      </div>
      {mobileNav}
    </div>
  );
}
