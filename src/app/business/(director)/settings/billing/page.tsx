import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BusinessBillingWorkspace } from "@/components/billing/business-billing-workspace";
import { ReferralWorkspace } from "@/components/referrals/referral-workspace";
import { getBusinessBillingSummary } from "@/lib/billing/billing-service";
import { getOrCreateBusinessReferralCode } from "@/lib/referrals/referral-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.settings.billing");
  return { title: t("metaTitle") };
}

export default async function BusinessBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/business/settings/billing");

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId) redirect("/business/onboarding");

  const summary = await getBusinessBillingSummary(orgId);
  const referral = await getOrCreateBusinessReferralCode(user.id);

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <BusinessBillingWorkspace summary={summary} />
      </Suspense>
      {"error" in referral ? null : <ReferralWorkspace profile={referral} />}
    </div>
  );
}
