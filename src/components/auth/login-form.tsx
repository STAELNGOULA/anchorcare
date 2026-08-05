"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  redirect?: string;
  inviteToken?: string;
};

const initialState: AuthActionState = {};

export function LoginForm({ redirect, inviteToken }: LoginFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {redirect ? (
        <input type="hidden" name="redirect" value={redirect} />
      ) : null}
      {inviteToken ? (
        <input type="hidden" name="inviteToken" value={inviteToken} />
      ) : null}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary transition-colors duration-300 ease-premium hover:text-primary/80"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">
            {t(state.fieldErrors.password)}
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
        {pending ? t("signingIn") : t("login")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          {t("signUp")}
        </Link>
      </p>
    </form>
  );
}
