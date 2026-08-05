"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type DirectorUserMenuProps = {
  email: string;
};

export function DirectorUserMenu({ email }: DirectorUserMenuProps) {
  const t = useTranslations("business");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = email.charAt(0).toUpperCase() || "A";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary ring-1 ring-border/50 transition-[transform,background-color] duration-300 ease-premium hover:bg-primary/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[12rem] rounded-[1rem] bg-card p-1.5 shadow-soft ring-1 ring-border/60"
        >
          <p className="truncate px-3 py-2 text-xs text-muted-foreground">
            {email}
          </p>
          <Link
            href="/business/settings"
            role="menuitem"
            className="flex min-h-10 items-center rounded-lg px-3 text-sm text-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80"
            onClick={() => setOpen(false)}
          >
            {t("userMenuSettings")}
          </Link>
          <Link
            href="/support"
            role="menuitem"
            className="flex min-h-10 items-center rounded-lg px-3 text-sm text-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80"
            onClick={() => setOpen(false)}
          >
            {t("userMenuSupport")}
          </Link>
          <form action={signOutAction} className="border-t border-border/40 pt-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm text-muted-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80 hover:text-foreground"
            >
              {t("userMenuSignOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
