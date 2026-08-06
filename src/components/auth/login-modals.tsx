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

type ModalState = "none" | "unverified" | "suspended" | "oauth_merge";

type LoginModalsProps = {
  modal: ModalState;
  onClose: () => void;
  onResendVerification: () => void | Promise<void>;
  oauthReturnTo: string;
};

export function LoginModals({
  modal,
  onClose,
  onResendVerification,
  oauthReturnTo,
}: LoginModalsProps) {
  const t = useTranslations("auth");

  return (
    <>
      <Dialog open={modal === "unverified"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("unverifiedTitle")}</DialogTitle>
            <DialogDescription>{t("unverifiedBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={() => void onResendVerification()}>
              {t("resendVerification")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "suspended"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("suspendedTitle")}</DialogTitle>
            <DialogDescription>{t("suspendedBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" asChild>
              <a href="mailto:support@anchor.care">{t("contactSupport")}</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "oauth_merge"} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("oauthMergeTitle")}</DialogTitle>
            <DialogDescription>{t("oauthMergeBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" asChild>
              <Link href={`/login${oauthReturnTo}`}>{t("signInWithEmail")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
