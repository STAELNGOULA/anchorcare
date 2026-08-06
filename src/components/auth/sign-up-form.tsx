"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AuthSuccessState } from "@/components/auth/auth-success-state";
import { CountryRegionFields } from "@/components/auth/country-region-fields";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { SignupDuplicateEmailModal } from "@/components/auth/signup-duplicate-email-modal";
import { TextField } from "@/components/forms/text-field";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";
import type { SignupSource } from "@/lib/auth/signup-source";
import type { CountryCode } from "@/lib/geo/regions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

type SignUpFormProps = {
  intent: "parent" | "program";
  inviteToken?: string;
  signupSource?: SignupSource;
  returnTo?: string;
  showOAuth?: boolean;
};

const initialState: AuthActionState = {};

function formatRetryMinutes(seconds?: number): number {
  if (!seconds) return 15;
  return Math.max(1, Math.ceil(seconds / 60));
}

export function SignUpForm({
  intent,
  inviteToken,
  signupSource = "organic",
  returnTo,
  showOAuth = true,
}: SignUpFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [country, setCountry] = useState<CountryCode>("US");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  useEffect(() => {
    if (state.error === "emailTaken" && state.duplicateEmail) {
      setDuplicateOpen(true);
    }
  }, [state.error, state.duplicateEmail]);

  if (state.success) {
    return (
      <div className="space-y-6">
        <AuthSuccessState
          title={t("signupSuccessTitle")}
          description={t(state.success as "checkEmail")}
        />
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href="/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="intent" value={intent} />
        <input type="hidden" name="signupSource" value={signupSource} />
        {inviteToken ? (
          <input type="hidden" name="inviteToken" value={inviteToken} />
        ) : null}

        <div className="sr-only" aria-hidden>
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {showOAuth ? (
          <OAuthButtons
            returnTo={returnTo}
            intent={intent}
            onOAuthError={() => setDuplicateOpen(false)}
          />
        ) : null}

        <TextField
          id="fullName"
          name="fullName"
          label={t("fullName")}
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          error={
            state.fieldErrors?.fullName
              ? t(state.fieldErrors.fullName as "nameRequired")
              : undefined
          }
        />

        <TextField
          id="email"
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          error={
            state.fieldErrors?.email
              ? t(state.fieldErrors.email as "emailInvalid")
              : undefined
          }
        />

        <CountryRegionFields
          country={country}
          region={region}
          onCountryChange={setCountry}
          onRegionChange={setRegion}
          countryError={
            state.fieldErrors?.country
              ? t(state.fieldErrors.country as "countryRequired")
              : undefined
          }
          regionError={
            state.fieldErrors?.region
              ? t(state.fieldErrors.region as "regionRequired")
              : undefined
          }
        />

        {!inviteToken && intent === "parent" ? (
          <TextField
            id="inviteCode"
            name="inviteCode"
            label={t("inviteCodeLabel")}
            type="text"
            autoComplete="off"
            placeholder={t("inviteCodePlaceholder")}
            hint={t("inviteCodeHint")}
          />
        ) : null}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium leading-none">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                state.fieldErrors?.password && "border-destructive",
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          <PasswordStrengthMeter password={password} />
          {state.fieldErrors?.password ? (
            <p className="text-xs text-destructive" role="alert">
              {t(state.fieldErrors.password as "passwordWeak")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium leading-none"
          >
            {t("confirmPassword")}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              className={cn(
                "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                state.fieldErrors?.confirmPassword && "border-destructive",
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          {state.fieldErrors?.confirmPassword ? (
            <p className="text-xs text-destructive" role="alert">
              {t(state.fieldErrors.confirmPassword as "passwordMismatch")}
            </p>
          ) : null}
        </div>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            name="acceptTerms"
            value="on"
            required
            className="mt-1 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
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
          <p className="text-sm text-destructive">{t("termsRequired")}</p>
        ) : null}

        {state.error && state.error !== "emailTaken" ? (
          <p
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {state.error === "signupRateLimited"
              ? t("signupRateLimited", {
                  minutes: formatRetryMinutes(state.retryAfterSeconds),
                })
              : t(state.error as "signUpFailed")}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
          disabled={pending}
        >
          {pending ? t("creatingAccount") : t("signUp")}
        </Button>
      </form>

      <SignupDuplicateEmailModal
        open={duplicateOpen}
        email={state.duplicateEmail}
        onClose={() => setDuplicateOpen(false)}
      />
    </>
  );
}
