import type { ReactNode } from "react";
import { DirectorMobileNav } from "@/components/business/director-nav";
import { DirectorSidebar } from "@/components/business/director-sidebar";
import { OrgBar } from "@/components/business/org-bar";
import {
  directorContainer,
  directorContent,
  directorMain,
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
      <DirectorSidebar context={context} />

      <div className="flex min-w-0 flex-1 flex-col">
        <OrgBar context={context} />
        <main
          id="main-content"
          className={cn(directorContent, "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8")}
        >
          <div className={directorContainer}>{children}</div>
        </main>
      </div>

      <DirectorMobileNav />
    </div>
  );
}
