"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { TextField } from "@/components/forms/text-field";
import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium leading-none">
          {t("newPassword")}
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
            aria-invalid={state.fieldErrors?.password ? true : undefined}
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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(
              "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              state.fieldErrors?.confirmPassword && "border-destructive",
            )}
            aria-invalid={state.fieldErrors?.confirmPassword ? true : undefined}
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

      {state.error ? (
        <p
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {t(state.error as "sessionExpired")}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
        disabled={pending}
      >
        {pending ? t("updatingPassword") : t("updatePassword")}
      </Button>
    </form>
  );
}
