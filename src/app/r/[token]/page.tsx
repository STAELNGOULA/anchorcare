import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { SmsReportErrorState } from "@/components/public/sms-report-error";
import { SmsReportViewer } from "@/components/public/sms-report-viewer";
import {
  getViewerUserId,
  loadSmsReportByToken,
} from "@/lib/reports/sms-token-service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.smsReport");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

function clientIpFromHeaders(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown"
  );
}

export default async function SmsReportPage({ params }: PageProps) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const headerStore = await headers();
  const clientIp = clientIpFromHeaders(headerStore);
  const viewerUserId = await getViewerUserId();

  const result = await loadSmsReportByToken(
    decoded,
    clientIp,
    viewerUserId,
  );

  if (result.state !== "valid") {
    return <SmsReportErrorState error={result} />;
  }

  return <SmsReportViewer payload={result} />;
}
