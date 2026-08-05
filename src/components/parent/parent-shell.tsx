import type { ReactNode } from "react";
import {
  ParentDesktopNav,
  ParentMobileNav,
} from "@/components/parent/parent-nav";
import { ParentTopBar } from "@/components/parent/parent-top-bar";
import {
  parentContent,
  parentMain,
  parentShellGrid,
  parentShellOuter,
} from "@/lib/parent/layout";
import type { ParentContext } from "@/lib/parent/parent-context";
import { cn } from "@/lib/utils";

type ParentShellProps = {
  children: ReactNode;
  context: ParentContext;
};

export function ParentShell({ children, context }: ParentShellProps) {
  return (
    <div className={parentMain}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={parentShellOuter}>
        <div className={parentShellGrid}>
          <ParentTopBar
            context={context}
            className="min-w-0 lg:col-span-2 lg:col-start-1"
          />
          <ParentDesktopNav />
          <main id="main-content" className={cn(parentContent)}>
            {children}
          </main>
        </div>
      </div>
      <ParentMobileNav />
    </div>
  );
}
