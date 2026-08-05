"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignUpFormProps = {
  intent: "parent" | "program";
  inviteToken?: string;
};

const initialState: AuthActionState = {};

export function SignUpForm({ intent, inviteToken }: SignUpFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="intent" value={intent} />
      {inviteToken ? (
        <input type="hidden" name="inviteToken" value={inviteToken} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
        />
        {state.fieldErrors?.fullName ? (
          <p className="text-sm text-destructive">
            {t(state.fieldErrors.fullName)}
          </p>
        ) : null}
      </div>

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
        <Label htmlFor="password">{t("password")}</Label>
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

      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          name="acceptTerms"
          value="on"
          required
          className="mt-1 h-4 w-4 rounded border-border"
        />
        <span>
          {t("termsAgree")}{" "}
          <Link href="/terms" className="text-primary hover:underline">
            {t("termsLink")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t("privacyLink")}
          </Link>
        </span>
      </label>
      {state.fieldErrors?.acceptTerms ? (
        <p className="text-sm text-destructive">
          {t(state.fieldErrors.acceptTerms)}
        </p>
      ) : null}

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
        {pending ? t("creatingAccount") : t("signUp")}
      </Button>
    </form>
  );
}
