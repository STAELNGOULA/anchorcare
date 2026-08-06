"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SkipProgramModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
};

export function SkipProgramModal({
  open,
  onClose,
  onConfirm,
  pending,
}: SkipProgramModalProps) {
  const t = useTranslations("business.onboarding");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("skipProgramTitle")}</DialogTitle>
          <DialogDescription>{t("skipProgramBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            {t("skipProgramCancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending ? t("finishing") : t("skipProgramConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
