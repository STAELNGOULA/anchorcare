import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDoctorForm } from "@/components/admin/doctors/admin-doctor-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("admin.doctors.form");
  return { title: t("editMetaTitle", { id }) };
}

export default async function AdminDoctorEditPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminDoctorForm doctorId={id} />;
}
