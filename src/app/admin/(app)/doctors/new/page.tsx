import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDoctorForm } from "@/components/admin/doctors/admin-doctor-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.doctors.form");
  return { title: t("createMetaTitle") };
}

export default function AdminDoctorNewPage() {
  return <AdminDoctorForm />;
}
