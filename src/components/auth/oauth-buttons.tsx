"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthButtonsProps = {
  returnTo?: string;
  intent?: "parent" | "program";
  onOAuthError?: () => void;
};

const SIGNUP_INTENT_COOKIE = "ANCHOR_SIGNUP_INTENT";

function setSignupIntentCookie(intent: "parent" | "program") {
  const maxAge = 60 * 60; // 1 hour
  document.cookie = `${SIGNUP_INTENT_COOKIE}=${intent}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function OAuthButtons({ returnTo, intent, onOAuthError }: OAuthButtonsProps) {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const signInWith = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      if (intent) setSignupIntentCookie(intent);
      const supabase = createClient();
      const origin = window.location.origin;
      const next = returnTo
        ? `?returnTo=${encodeURIComponent(returnTo)}`
        : "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback${next}`,
        },
      });

      if (error) {
        onOAuthError?.();
      }
    } catch {
      onOAuthError?.();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
        disabled={loading !== null}
        onClick={() => void signInWith("google")}
      >
        {loading === "google" ? t("signingIn") : t("continueWithGoogle")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]"
        disabled={loading !== null}
        onClick={() => void signInWith("apple")}
      >
        {loading === "apple" ? t("signingIn") : t("continueWithApple")}
      </Button>
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <p className="relative mx-auto w-fit bg-card px-3 text-xs text-muted-foreground">
          {t("orContinueWithEmail")}
        </p>
      </div>
    </div>
  );
}
