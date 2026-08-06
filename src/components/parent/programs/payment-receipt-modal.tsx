"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PaymentReceiptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationId: string | null;
};

export function PaymentReceiptModal({
  open,
  onOpenChange,
  registrationId,
}: PaymentReceiptModalProps) {
  const t = useTranslations("parent.programs.enrolled.receipt");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {registrationId ? (
          <p className="rounded-lg bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
            {registrationId}
          </p>
        ) : null}
        <Button className="rounded-full" onClick={() => onOpenChange(false)}>
          {t("close")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
