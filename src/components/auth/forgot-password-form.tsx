"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthSuccessState } from "@/components/auth/auth-success-state";
import { TextField } from "@/components/forms/text-field";
import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {};

function formatRetryMinutes(seconds?: number): number {
  if (!seconds) return 15;
  return Math.max(1, Math.ceil(seconds / 60));
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );
  const [email, setEmail] = useState("");

  if (state.success) {
    return (
      <div className="space-y-6">
        <AuthSuccessState
          title={t("resetSuccessTitle")}
          description={t("resetSuccessBody")}
        />
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <TextField
        id="email"
        name="email"
        label={t("email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={
          state.fieldErrors?.email
            ? t(state.fieldErrors.email as "emailInvalid")
            : undefined
        }
      />

      {state.error ? (
        <p
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error === "resetRateLimited"
            ? t("resetRateLimited", {
                minutes: formatRetryMinutes(state.retryAfterSeconds),
              })
            : t(state.error as "unknownError")}
        </p>
      ) : null}

      <Button
        type="submit"
        className={cn(
          "w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]",
        )}
        disabled={pending}
      >
        {pending ? t("sending") : t("sendResetLink")}
      </Button>
    </form>
  );
}
