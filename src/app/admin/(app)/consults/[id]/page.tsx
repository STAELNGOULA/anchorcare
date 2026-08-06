import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminConsultWorkspace } from "@/components/admin/consults/admin-consult-workspace";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.consults.workspace");
  return { title: t("metaTitle") };
}

export default async function AdminConsultDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminConsultWorkspace consultId={id} />;
}
