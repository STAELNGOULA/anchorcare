"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TrialEndingModalProps = {
  open: boolean;
  trialDaysLeft: number;
};

export function TrialEndingModal({ open, trialDaysLeft }: TrialEndingModalProps) {
  const t = useTranslations("business.dashboard.trialEnding");
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("title", { days: trialDaysLeft })}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-full" onClick={() => setVisible(false)}>
            {t("dismiss")}
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/business/settings/billing">{t("upgrade")}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
