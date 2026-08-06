import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDoctorsWorkspace } from "@/components/admin/doctors/admin-doctors-workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.doctors");
  return { title: t("metaTitle") };
}

export default function AdminDoctorsPage() {
  return <AdminDoctorsWorkspace />;
}
