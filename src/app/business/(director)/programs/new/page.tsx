import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProgramCreateWizard } from "@/components/business/programs/program-create-wizard";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.programs.new");
  return { title: t("metaTitle") };
}

export default async function BusinessProgramsNewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/business/programs/new");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("country")
    .eq("id", orgId)
    .maybeSingle();

  const defaultCurrency = org?.country === "CA" ? "CAD" : "USD";

  return <ProgramCreateWizard defaultCurrency={defaultCurrency} />;
}
