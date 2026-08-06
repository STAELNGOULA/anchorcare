import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FieldRosterWorkspace } from "@/components/roster/field-roster-workspace";
import { RosterWorkspace } from "@/components/roster/roster-workspace";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import { listRosterForOrg } from "@/lib/roster/roster-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.families.children");
  return { title: t("metaTitle") };
}

type PageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function BusinessFamiliesChildrenPage({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/families/children");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const { items, total, programs } = await listRosterForOrg(orgId);
  const isFieldMode = mode === "field";

  if (isFieldMode) {
    return (
      <FieldRosterWorkspace
        mode="business"
        initialItems={items}
        initialTotal={total}
        programs={programs}
        emptyCtaHref="/business/settings/invites"
      />
    );
  }

  return (
    <RosterWorkspace
      mode="business"
      initialItems={items}
      initialTotal={total}
      programs={programs}
      detailBasePath="/business/families/children"
      emptyCtaHref="/business/settings/invites"
      fieldModeHref="/business/families/children?mode=field"
      handoffHref="/business/roster/handoff"
    />
  );
}
