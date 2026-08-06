import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegistrationsQueue } from "@/components/business/registrations/registrations-queue";
import {
  getAdoptionStats,
  getDirectorOrgId,
  listRegistrationsForOrg,
} from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.families.registrations");
  return { title: t("metaTitle") };
}

export default async function BusinessRegistrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/families/registrations");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const [{ items }, adoption] = await Promise.all([
    listRegistrationsForOrg(user.id, orgId),
    getAdoptionStats(orgId),
  ]);

  return <RegistrationsQueue items={items} adoption={adoption} />;
}
