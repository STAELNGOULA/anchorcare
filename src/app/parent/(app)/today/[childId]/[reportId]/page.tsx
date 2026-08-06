import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ReportDetailPaywallState } from "@/components/parent/report/report-detail-paywall";
import { ReportDetailWorkspace } from "@/components/parent/report/report-detail-workspace";
import { getParentContext } from "@/lib/parent/parent-context";
import { getParentReportDetail } from "@/lib/parent/report-detail-service";
import { recordParentEngagement } from "@/lib/parent/today-service";

type PageProps = {
  params: Promise<{ childId: string; reportId: string }>;
  searchParams: Promise<{ share?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { childId, reportId } = await params;
  const { share } = await searchParams;
  const context = await getParentContext();
  const result = await getParentReportDetail(
    context.userId,
    context.plan,
    childId,
    reportId,
    { shareMode: share === "1" },
  );

  const t = await getTranslations("parent.today.detail");

  if (result.state === "valid") {
    return {
      title: t("metaTitle"),
      robots: share === "1" ? { index: false, follow: false } : undefined,
    };
  }

  return { title: t("metaTitle") };
}

export default async function ParentTodayReportDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { childId, reportId } = await params;
  const { share } = await searchParams;
  const shareMode = share === "1";
  const t = await getTranslations("parent.today.detail");
  const context = await getParentContext();

  const result = await getParentReportDetail(
    context.userId,
    context.plan,
    childId,
    reportId,
    { shareMode },
  );

  if (result.state === "unavailable") {
    if (result.reason === "forbidden") notFound();
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <h1 className="font-display text-2xl text-foreground">
          {t("unavailableTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("unavailable")}</p>
        <Link
          href={`/parent/today?childId=${childId}`}
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background"
        >
          {t("backToToday")}
        </Link>
      </div>
    );
  }

  if (result.state === "paywalled") {
    return (
      <ReportDetailPaywallState paywall={result} childId={childId} />
    );
  }

  if (!shareMode) {
    await recordParentEngagement(context.userId, "report_read", {
      childId,
      timelineEventId: result.timelineEventId ?? undefined,
      metadata: {
        dailyReportId: result.dailyReportId,
        reportChildId: result.reportChildId,
        source: "today_detail",
      },
    });
  }

  return <ReportDetailWorkspace detail={result} shareMode={shareMode} />;
}
