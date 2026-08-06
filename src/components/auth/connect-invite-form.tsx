"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConnectInviteForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (trimmed.length < 8) {
      setError(t("inviteInvalid"));
      return;
    }
    router.push(`/invite/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{t("connectBody")}</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">{t("inviteCodeLabel")}</Label>
          <Input
            id="token"
            name="token"
            type="text"
            autoComplete="off"
            placeholder={t("inviteCodePlaceholder")}
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setError(null);
            }}
            required
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="w-full rounded-full">
          {t("linkProgram")}
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
