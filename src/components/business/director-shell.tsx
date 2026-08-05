import type { ReactNode } from "react";
import {
  DirectorDesktopNav,
  DirectorMobileNav,
} from "@/components/business/director-nav";
import { OrgBar } from "@/components/business/org-bar";
import {
  directorContent,
  directorMain,
  directorShellGrid,
  directorShellOuter,
} from "@/lib/business/layout";
import type { DirectorContext } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type DirectorShellProps = {
  children: ReactNode;
  context: DirectorContext;
};

export function DirectorShell({ children, context }: DirectorShellProps) {
  return (
    <div className={directorMain}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={directorShellOuter}>
        <div className={directorShellGrid}>
          <OrgBar
            context={context}
            className="min-w-0 lg:col-span-2 lg:col-start-1"
          />
          <DirectorDesktopNav />
          <main id="main-content" className={cn(directorContent)}>
            {children}
          </main>
        </div>
      </div>
      <DirectorMobileNav />
    </div>
  );
}
