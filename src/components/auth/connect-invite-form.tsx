"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState } from "react";
import { acceptInviteAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ConnectInviteForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    acceptInviteAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("connectBody")}
      </p>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">{t("inviteCodeLabel")}</Label>
          <Input
            id="token"
            name="token"
            type="text"
            autoComplete="off"
            placeholder={t("inviteCodePlaceholder")}
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t(state.error)}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={pending}
        >
          {pending ? t("linking") : t("linkProgram")}
        </Button>
      </form>

      <div className="rounded-xl bg-secondary/60 px-4 py-4 text-sm text-muted-foreground">
        <p>{t("connectHelp")}</p>
        <p className="mt-2">
          <Link href="/support" className="font-medium text-primary hover:underline">
            {t("contactSupport")}
          </Link>
        </p>
      </div>
    </div>
  );
}
