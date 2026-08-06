"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { LoginModals } from "@/components/auth/login-modals";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/forms/text-field";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export type LoginVariant = "default" | "admin";

type LoginFormProps = {
  returnTo?: string;
  inviteToken?: string;
  variant?: LoginVariant;
  intent?: "parent" | "program" | "admin";
  initialEmail?: string;
};

type ModalState = "none" | "unverified" | "suspended" | "oauth_merge";

export function LoginForm({
  returnTo,
  inviteToken,
  variant = "default",
  intent,
  initialEmail,
}: LoginFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [pending, setPending] = useState(false);
  const [shake, setShake] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>("none");
  const [cooldown, setCooldown] = useState(0);

  const triggerShake = useCallback(() => {
    setShake(true);
    window.setTimeout(() => setShake(false), 120);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setPending(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(variant === "admin" ? { "x-anchor-admin-login": "1" } : {}),
        },
        body: JSON.stringify({
          email,
          password,
          rememberDevice,
          returnTo,
          inviteToken,
          admin: variant === "admin",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        redirect?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
        retryAfterSeconds?: number;
      };

      if (res.ok && data.ok && data.redirect) {
        toast.success(t("welcomeBack"));
        document.documentElement.classList.add("opacity-0");
        window.setTimeout(() => {
          router.push(data.redirect!);
          router.refresh();
        }, 200);
        return;
      }

      triggerShake();

      if (data.fieldErrors) {
        setFieldErrors(data.fieldErrors);
      }

      if (data.error === "emailNotVerified") {
        setModal("unverified");
        return;
      }
      if (data.error === "accountSuspended") {
        setModal("suspended");
        return;
      }
      if (data.error === "rateLimited" && data.retryAfterSeconds) {
        setCooldown(data.retryAfterSeconds);
        setFormError(t("rateLimited", { seconds: data.retryAfterSeconds }));
        return;
      }

      setFormError(t(data.error ?? "invalidCredentials"));
    } catch {
      triggerShake();
      setFormError(t("unknownError"));
    } finally {
      setPending(false);
    }
  };

  const handleResendVerification = async () => {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    toast.success(t("verificationResent"));
    setModal("none");
  };

  const oauthReturnTo = returnTo
    ? `?returnTo=${encodeURIComponent(returnTo)}`
    : "";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "space-y-5 motion-safe:transition-transform",
          shake && "motion-safe:animate-[shake_0.12s_ease-in-out]",
        )}
        noValidate
      >
        {variant !== "admin" ? (
          <OAuthButtons
            returnTo={returnTo}
            onOAuthError={() => setModal("oauth_merge")}
          />
        ) : null}

        <div className="space-y-4">
          <TextField
            id="email"
            name="email"
            label={t("email")}
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={
              fieldErrors.email ? t(fieldErrors.email as "emailInvalid") : undefined
            }
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">{t("password")}</Label>
              <a
                href="/forgot-password"
                className="text-sm text-primary transition-colors duration-[var(--motion-micro)] ease-premium hover:text-primary/80"
              >
                {t("forgotPassword")}
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 pr-12 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  fieldErrors.password && "border-destructive",
                )}
                aria-invalid={fieldErrors.password ? true : undefined}
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
            {fieldErrors.password ? (
              <p className="text-xs text-destructive" role="alert">
                {t(fieldErrors.password as "passwordRequired")}
              </p>
            ) : null}
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="rememberDevice"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            {t("rememberDevice")}
          </label>
        </div>

        {formError ? (
          <p
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
          disabled={pending || cooldown > 0}
        >
          {pending
            ? t("signingIn")
            : cooldown > 0
              ? t("rateLimited", { seconds: cooldown })
              : t("login")}
        </Button>

        {variant !== "admin" ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <a
              href={
                intent === "program"
                  ? "/sign-up?intent=program"
                  : "/sign-up?intent=parent"
              }
              className="font-medium text-primary hover:underline"
            >
              {t("signUp")}
            </a>
          </p>
        ) : null}

        {variant !== "admin" && intent !== "program" ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("programPrompt")}{" "}
            <a
              href="/sign-up?intent=program"
              className="font-medium text-primary hover:underline"
            >
              {t("programSignupLink")}
            </a>
          </p>
        ) : null}
      </form>

      <LoginModals
        modal={modal}
        onClose={() => setModal("none")}
        onResendVerification={handleResendVerification}
        oauthReturnTo={oauthReturnTo}
      />
    </>
  );
}
