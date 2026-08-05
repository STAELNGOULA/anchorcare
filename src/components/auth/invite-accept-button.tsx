"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { acceptInviteAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

type InviteAcceptButtonProps = {
  token: string;
};

const initialState: AuthActionState = {};

export function InviteAcceptButton({ token }: InviteAcceptButtonProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    acceptInviteAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">{t("inviteSignedIn")}</p>
      {state.error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t(state.error)}
        </p>
      ) : null}
      <Button type="submit" className="w-full rounded-full" disabled={pending}>
        {pending ? t("linking") : t("inviteContinue")}
      </Button>
    </form>
  );
}
