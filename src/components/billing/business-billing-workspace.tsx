"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import type { BusinessBillingSummary } from "@/lib/billing/billing-types";
import { cn } from "@/lib/utils";

type BusinessBillingWorkspaceProps = {
  summary: BusinessBillingSummary;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function BusinessBillingWorkspace({ summary }: BusinessBillingWorkspaceProps) {
  const t = useTranslations("business.settings.billing");
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const { entitlements } = summary;
  const onPro = entitlements.proActive;

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success(t("checkoutSuccess"));
    }
  }, [searchParams, t]);

  const runAction = useCallback(
    async (action: "checkout" | "portal") => {
      setPending(true);
      try {
        const res = await fetch("/api/business/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(t(`errors.${data.error ?? "failed"}`));
          return;
        }
        window.location.href = data.url;
      } catch {
        toast.error(t("errors.failed"));
      } finally {
        setPending(false);
      }
    },
    [t],
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {entitlements.trialActive && !onPro ? (
        <BezelCard className="border border-primary/25 bg-primary/6 p-5 md:p-6">
          <p className="font-display text-lg text-foreground">
            {t("trialTitle", { days: entitlements.trialDaysLeft })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("trialBody")}</p>
        </BezelCard>
      ) : null}

      {!entitlements.canPublish && !onPro ? (
        <BezelCard className="border border-accent/30 bg-accent/8 p-5 md:p-6">
          <p className="font-medium text-foreground">{t("lapsedTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("lapsedBody")}</p>
        </BezelCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <BezelCard className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("plans.trial")}
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">
              {entitlements.trialActive ? t("trialActive") : t("trialEnded")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{t("trialBullet1")}</li>
              <li>{t("trialBullet2")}</li>
            </ul>
          </div>
        </BezelCard>

        <BezelCard
          className={cn(
            "flex flex-col justify-between p-6 md:p-8",
            onPro && "ring-1 ring-primary/30",
          )}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
              {t("plans.pro")}
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">{t("proPrice")}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{t("proBullet1")}</li>
              <li>{t("proBullet2")}</li>
              <li>{t("proBullet3")}</li>
            </ul>
          </div>
          {onPro ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-primary">{t("currentPlan")}</p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() => runAction("portal")}
              >
                {t("manageBilling")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="mt-6 min-h-11"
              disabled={pending || !summary.stripeConfigured}
              onClick={() => runAction("checkout")}
            >
              {t("subscribeCta")}
            </Button>
          )}
        </BezelCard>
      </div>

      {!summary.stripeConfigured ? (
        <p className="text-sm text-muted-foreground">{t("stripeNotConfigured")}</p>
      ) : null}

      {summary.invoices.length > 0 ? (
        <section>
          <h2 className="font-display text-lg text-foreground">{t("invoicesTitle")}</h2>
          <div className="mt-3 space-y-2">
            {summary.invoices.map((invoice) => (
              <BezelCard
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {invoice.number ?? invoice.id.slice(-8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invoice.created * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground">
                    {formatMoney(invoice.amountDue, invoice.currency)}
                  </span>
                  {invoice.hostedInvoiceUrl ? (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {t("viewInvoice")}
                    </a>
                  ) : null}
                </div>
              </BezelCard>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href="/business/settings"
        className="inline-flex text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {t("backToSettings")}
      </Link>
    </div>
  );
}
