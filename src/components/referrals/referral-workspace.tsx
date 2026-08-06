"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import type { ReferralProfile } from "@/lib/referrals/referral-service";

type ReferralWorkspaceProps = {
  profile: ReferralProfile;
};

export function ReferralWorkspace({ profile }: ReferralWorkspaceProps) {
  const t = useTranslations("referrals");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.shareUrl);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <BezelCard className="space-y-4 p-6">
      <h2 className="font-display text-xl text-foreground">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t(profile.rewardDescription)}</p>
      <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 font-mono text-sm">
        {profile.code}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("attributions", { count: profile.attributionsCount })}
      </p>
      <Button type="button" className="rounded-full" onClick={() => void copy()}>
        {t("copyLink")}
      </Button>
    </BezelCard>
  );
}
