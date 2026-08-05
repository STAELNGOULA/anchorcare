import type { ReactNode } from "react";
import { AdminDesktopNav, AdminMobileNav } from "@/components/admin/admin-nav";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import {
  adminContent,
  adminMain,
  adminShellGrid,
  adminShellOuter,
} from "@/lib/admin/layout";
import type { AdminContext } from "@/lib/admin/admin-context";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  context: AdminContext;
};

export function AdminShell({ children, context }: AdminShellProps) {
  return (
    <div className={adminMain}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className={adminShellOuter}>
        <div className={adminShellGrid}>
          <AdminTopBar
            context={context}
            className="min-w-0 lg:col-span-2 lg:col-start-1"
          />
          <AdminDesktopNav />
          <main id="main-content" className={cn(adminContent)}>
            {children}
          </main>
        </div>
      </div>
      <AdminMobileNav />
    </div>
  );
}
