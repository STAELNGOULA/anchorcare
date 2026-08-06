import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComplianceExportWorkspace } from "@/components/business/compliance/compliance-export-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.compliance");
  return { title: t("metaTitle") };
}

export default function BusinessCompliancePage() {
  return <ComplianceExportWorkspace />;
}
