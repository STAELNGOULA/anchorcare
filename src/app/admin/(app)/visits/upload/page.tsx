import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminVisitUploadWorkspace } from "@/components/admin/visits/admin-visit-upload-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.visits");
  return { title: t("metaTitle") };
}

export default function AdminVisitUploadPage() {
  return <AdminVisitUploadWorkspace />;
}
