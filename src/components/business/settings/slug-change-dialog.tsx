"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SlugChangeDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function SlugChangeDialog({ open, onClose, onConfirm }: SlugChangeDialogProps) {
  const t = useTranslations("business.settings.profileEditor.slugDialog");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" className="rounded-full" onClick={onConfirm}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
