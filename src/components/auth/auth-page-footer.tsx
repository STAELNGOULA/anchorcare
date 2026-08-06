"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const switchLocale = async (next: Locale) => {
    if (next === locale || pending) return;
    setPending(true);
    try {
      await setLocaleAction(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-full bg-secondary p-1", className)}
      role="group"
      aria-label={t("languageToggle")}
    >
      {(["en", "fr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => switchLocale(code)}
          className={cn(
            "min-h-9 rounded-full px-3 text-xs font-medium uppercase tracking-wide transition-colors duration-[var(--motion-micro)]",
            locale === code
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function AuthPageFooter() {
  const t = useTranslations("auth");

  return (
    <footer className="mt-8 space-y-4 border-t border-border/60 pt-6">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          {t("termsLink")}
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:text-foreground">
          {t("privacyLink")}
        </Link>
      </div>
      <div className="flex justify-center">
        <LocaleToggle />
      </div>
    </footer>
  );
}
