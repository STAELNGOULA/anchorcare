"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteChildDialogProps = {
  childId: string;
  childName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteChildDialog({
  childId,
  childName,
  open,
  onOpenChange,
}: DeleteChildDialogProps) {
  const t = useTranslations("parent.family.children.delete");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/parent/children/${childId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(t(`errors.${data.error ?? "deleteFailed"}` as "errors.deleteFailed"));
        return;
      }
      toast.success(t("success"));
      onOpenChange(false);
      router.push("/parent/family/children");
      router.refresh();
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("title")}</DialogTitle>
          <DialogDescription>{t("body", { name: childName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? t("deleting") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
