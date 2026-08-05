import type { ReactNode } from "react";
import { CoachDesktopNav, CoachMobileNav } from "@/components/coach/coach-nav";
import { CoachTopBar } from "@/components/coach/coach-top-bar";
import {
  coachContent,
  coachMain,
  coachShellGrid,
  coachShellOuter,
} from "@/lib/coach/layout";
import type { CoachContext } from "@/lib/coach/coach-context";
import { cn } from "@/lib/utils";

type CoachShellProps = {
  children: ReactNode;
  context: CoachContext;
};

export function CoachShell({ children, context }: CoachShellProps) {
  return (
    <div className={coachMain}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={coachShellOuter}>
        <div className={coachShellGrid}>
          <CoachTopBar
            context={context}
            className="min-w-0 lg:col-span-2 lg:col-start-1"
          />
          <CoachDesktopNav />
          <main id="main-content" className={cn(coachContent)}>
            {children}
          </main>
        </div>
      </div>
      <CoachMobileNav />
    </div>
  );
}
