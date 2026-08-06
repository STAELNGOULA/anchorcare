import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { OrgProfileWorkspace } from "@/components/business/settings/org-profile-workspace";
import { getOrgProfileForDirector } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.profile");
  return { title: t("metaTitle") };
}

export default async function OrganizationProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/settings/profile");

  const profile = await getOrgProfileForDirector(user.id);
  if (!profile) redirect("/business/onboarding");

  return <OrgProfileWorkspace initialProfile={profile} />;
}
