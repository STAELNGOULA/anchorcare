import Link from "next/link";
import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReportDetailPaywall } from "@/lib/parent/report-detail-types";

type ReportDetailPaywallProps = {
  paywall: ReportDetailPaywall;
  childId: string;
};

function formatReportDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${isoDate}T12:00:00`));
  } catch {
    return isoDate;
  }
}

export async function ReportDetailPaywallState({
  paywall,
  childId,
}: ReportDetailPaywallProps) {
  const t = await getTranslations("parent.today.detail.paywall");

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted ring-1 ring-border/50">
        <Lock className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-3">
        <h1 className="font-display text-2xl text-foreground">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("body", {
            name: paywall.childFirstName,
            date: formatReportDate(paywall.reportDate),
            program: paywall.programName,
          })}
        </p>
      </div>
      <ul className="space-y-2 text-left text-sm text-muted-foreground">
        <li className="flex gap-2">
          <span className="text-primary" aria-hidden>
            ·
          </span>
          {t("benefitHistory")}
        </li>
        <li className="flex gap-2">
          <span className="text-primary" aria-hidden>
            ·
          </span>
          {t("benefitPhotos")}
        </li>
        <li className="flex gap-2">
          <span className="text-primary" aria-hidden>
            ·
          </span>
          {t("benefitPrograms")}
        </li>
      </ul>
      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/parent/you/subscription"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          {t("upgradeCta")}
        </Link>
        <Link
          href={`/parent/today?childId=${childId}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("backToToday")}
        </Link>
      </div>
    </div>
  );
}
