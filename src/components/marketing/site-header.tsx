"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { PremiumCta } from "@/components/marketing/premium-cta";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { marketingContainer } from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  labels: {
    navHowItWorks: string;
    navSupport: string;
    navForParents: string;
    navForPrograms: string;
    ctaRegister: string;
    ctaLogin: string;
    menuOpen: string;
    menuClose: string;
  };
};

const navLinks = [
  { href: "/for-programs", key: "navForPrograms" as const },
  { href: "/for-parents", key: "navForParents" as const },
  { href: "/support", key: "navSupport" as const },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function SiteHeader({ labels }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (open) {
      main.setAttribute("inert", "");
      main.setAttribute("aria-hidden", "true");
    } else {
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    }
    return () => {
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const firstLink = panel?.querySelector<HTMLElement>(FOCUSABLE);
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => !node.hasAttribute("disabled"));

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeMenu]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-5 md:pt-6">
        <div className={cn(marketingContainer, "pointer-events-none")}>
          <div
            className={cn(
              "pointer-events-auto flex w-full items-center justify-between gap-4",
            "rounded-full border border-border/50 bg-background/75 px-3 py-2 pl-4 shadow-[0_20px_60px_-24px_rgba(15,42,61,0.18)]",
            "backdrop-blur-xl supports-[backdrop-filter]:bg-background/65",
          )}
        >
          <Link
            href="/"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AnchorLogo />
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            {navLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors duration-300 ease-premium hover:bg-secondary/70 hover:text-foreground"
              >
                {labels[item.key]}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle variant="pill" />
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
            >
              {labels.ctaLogin}
            </Link>
            <PremiumCta href="/sign-up" className="!px-4 !py-2.5 text-sm">
              {labels.ctaRegister}
            </PremiumCta>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle variant="pill" />
          <button
            ref={triggerRef}
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80"
            aria-expanded={open}
            aria-controls={menuId}
            aria-haspopup="dialog"
            aria-label={open ? labels.menuClose : labels.menuOpen}
            onClick={() => setOpen((value) => !value)}
          >
            <span
              className={cn(
                "absolute block h-0.5 w-5 rounded-full bg-current motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-premium",
                open ? "translate-y-0 rotate-45" : "-translate-y-1.5",
              )}
            />
            <span
              className={cn(
                "absolute block h-0.5 w-5 rounded-full bg-current motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-premium",
                open ? "opacity-0" : "opacity-100",
              )}
            />
            <span
              className={cn(
                "absolute block h-0.5 w-5 rounded-full bg-current motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-premium",
                open ? "translate-y-0 -rotate-45" : "translate-y-1.5",
              )}
            />
          </button>
          </div>
        </div>
        </div>
      </header>

      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={labels.menuOpen}
        className={cn(
          "fixed inset-0 z-30 bg-background/90 backdrop-blur-3xl motion-safe:transition-[opacity,visibility] motion-safe:duration-500 motion-safe:ease-premium md:hidden",
          open
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav
          className="flex min-h-[100dvh] flex-col justify-center gap-2 px-8 pt-24"
          aria-label="Mobile"
        >
          {navLinks.map((item, index) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "font-display text-3xl text-foreground motion-safe:transition-[transform,opacity] motion-safe:duration-700 motion-safe:ease-premium",
                open
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
              style={{ transitionDelay: open ? `${100 + index * 75}ms` : "0ms" }}
              onClick={closeMenu}
            >
              {labels[item.key]}
            </Link>
          ))}
          <div
            className={cn(
              "mt-8 flex flex-col gap-3 motion-safe:transition-[transform,opacity] motion-safe:duration-700 motion-safe:ease-premium",
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
            style={{ transitionDelay: open ? "325ms" : "0ms" }}
          >
            <PremiumCta href="/sign-up" onClick={closeMenu}>
              {labels.ctaRegister}
            </PremiumCta>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-muted-foreground ring-1 ring-border/70 transition-colors duration-300 ease-premium hover:text-foreground"
              onClick={closeMenu}
            >
              {labels.ctaLogin}
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
