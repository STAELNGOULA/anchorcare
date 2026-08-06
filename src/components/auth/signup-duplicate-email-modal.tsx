"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SignupDuplicateEmailModalProps = {
  open: boolean;
  email?: string;
  onClose: () => void;
};

export function SignupDuplicateEmailModal({
  open,
  email,
  onClose,
}: SignupDuplicateEmailModalProps) {
  const t = useTranslations("auth");
  const loginHref = email
    ? `/login?email=${encodeURIComponent(email)}`
    : "/login";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("emailTakenTitle")}</DialogTitle>
          <DialogDescription>{t("emailTakenBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" asChild>
            <Link href={loginHref}>{t("signInInstead")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
