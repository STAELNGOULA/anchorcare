import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentSubscriptionWorkspace } from "@/components/billing/parent-subscription-workspace";
import { ReferralWorkspace } from "@/components/referrals/referral-workspace";
import { getParentBillingSummary } from "@/lib/billing/billing-service";
import { getOrCreateParentReferralCode } from "@/lib/referrals/referral-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.subscription");
  return { title: t("metaTitle") };
}

export default async function ParentSubscriptionPage() {
  const context = await getParentContext();
  const summary = await getParentBillingSummary(
    context.userId,
    context.childrenCount,
  );
  const referral = await getOrCreateParentReferralCode(context.userId);

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <ParentSubscriptionWorkspace summary={summary} />
      </Suspense>
      <ReferralWorkspace profile={referral} />
    </div>
  );
}
