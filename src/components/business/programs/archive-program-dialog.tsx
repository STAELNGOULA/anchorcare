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

type ArchiveProgramDialogProps = {
  open: boolean;
  programName: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ArchiveProgramDialog({
  open,
  programName,
  onClose,
  onConfirm,
}: ArchiveProgramDialogProps) {
  const t = useTranslations("business.programs.archiveDialog");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body", { name: programName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => void onConfirm()}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
