"use client";

import Link from "next/link";
import { Clock, HeartPulse, MessageCircle, Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";

type TodayQuickLinksProps = {
  onRunningLate?: () => void;
  onMorningHealth?: () => void;
};

export function TodayQuickLinks({
  onRunningLate,
  onMorningHealth,
}: TodayQuickLinksProps) {
  const t = useTranslations("parent.today");

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onMorningHealth}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-foreground ring-1 ring-border/60 transition-[transform,background-color] duration-200 ease-out hover:bg-muted/40 active:scale-[0.98]"
      >
        <Thermometer className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        {t("quickLinks.morningHealth")}
      </button>
      <button
        type="button"
        onClick={onRunningLate}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-foreground ring-1 ring-border/60 transition-[transform,background-color] duration-200 ease-out hover:bg-muted/40 active:scale-[0.98]"
      >
        <Clock className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
        {t("quickLinks.runningLate")}
      </button>
      <Link
        href="/parent/care"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
      >
        <HeartPulse className="size-4 text-primary" aria-hidden />
        {t("quickLinks.care")}
      </Link>
      <Link
        href="/parent/messages"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-foreground ring-1 ring-border/60 transition-transform duration-200 ease-out active:scale-[0.98]"
      >
        <MessageCircle className="size-4 text-primary" aria-hidden />
        {t("quickLinks.messages")}
      </Link>
    </div>
  );
}
