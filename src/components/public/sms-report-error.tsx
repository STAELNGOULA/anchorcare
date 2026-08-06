import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SmsReportError } from "@/lib/reports/sms-report-types";

type SmsReportErrorStateProps = {
  error: SmsReportError;
};

export async function SmsReportErrorState({ error }: SmsReportErrorStateProps) {
  const t = await getTranslations("public.smsReport.errors");

  const copyKey =
    error.state === "expired"
      ? "expired"
      : error.state === "max_views"
        ? "maxViews"
        : error.state === "revoked"
          ? "revoked"
          : error.state === "not_published"
            ? "notPublished"
            : error.state === "rate_limited"
              ? "rateLimited"
              : "invalid";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="font-display text-2xl text-foreground">{t(`${copyKey}.title`)}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(`${copyKey}.body`)}
        </p>
        {error.retryAfterSeconds ? (
          <p className="text-xs text-muted-foreground">
            {t("rateLimited.retry", { seconds: error.retryAfterSeconds })}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
          <Link
            href="/login?redirect=/parent/today"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm text-background"
          >
            {t("actions.signIn")}
          </Link>
          <Link
            href="/sign-up/parent"
            className="inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm ring-1 ring-border/60"
          >
            {t("actions.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
