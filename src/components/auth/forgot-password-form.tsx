"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{t(state.fieldErrors.email)}</p>
        ) : null}
      </div>

      {state.error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t(state.error)}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          {t(state.success)}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={pending}
      >
        {pending ? t("sending") : t("sendResetLink")}
      </Button>
    </form>
  );
}
