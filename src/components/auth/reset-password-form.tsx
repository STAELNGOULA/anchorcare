"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">
            {t(state.fieldErrors.password)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className="text-sm text-destructive">
            {t(state.fieldErrors.confirmPassword)}
          </p>
        ) : null}
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
        {pending ? t("updatingPassword") : t("updatePassword")}
      </Button>
    </form>
  );
}
