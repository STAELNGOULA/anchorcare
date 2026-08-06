import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DigestSettingsWorkspace } from "@/components/business/settings/digest-settings-workspace";
import {
  buildBusinessDigestMetrics,
  getOrgDigestSettings,
} from "@/lib/digest/digest-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.digest");
  return { title: t("metaTitle") };
}

export default async function BusinessDigestSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/settings/digest");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const settings = await getOrgDigestSettings(orgId);
  const previewMetrics = await buildBusinessDigestMetrics(orgId);

  return (
    <DigestSettingsWorkspace
      initialSettings={settings}
      directorEmail={user.email ?? null}
      previewMetrics={previewMetrics}
    />
  );
}
