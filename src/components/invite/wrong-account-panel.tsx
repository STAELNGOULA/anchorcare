"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type WrongAccountPanelProps = {
  token: string;
  inviteEmail: string;
  currentEmail: string;
};

export function WrongAccountPanel({
  token,
  inviteEmail,
  currentEmail,
}: WrongAccountPanelProps) {
  const t = useTranslations("auth.inviteFlow");
  const redirect = encodeURIComponent(`/invite/${token}`);

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium text-foreground">{t("wrongAccountTitle")}</p>
      <p className="text-muted-foreground">
        {t("wrongAccountBody", { inviteEmail, currentEmail })}
      </p>
      <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
        <Link href={`/login?redirect=${redirect}`}>{t("switchAccount")}</Link>
      </Button>
    </div>
  );
}
