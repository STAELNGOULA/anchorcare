"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StripeConnectBanner() {
  const t = useTranslations("business.programs.stripe");
  const [pending, setPending] = useState(false);

  const startConnect = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/business/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(t(`errors.${data.error ?? "failed"}` as "errors.failed"));
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-amber-500/30 bg-amber-500/5 px-5 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </div>
      <Button
        type="button"
        className="rounded-full"
        disabled={pending}
        onClick={() => void startConnect()}
      >
        {pending ? t("connecting") : t("cta")}
      </Button>
    </div>
  );
}
