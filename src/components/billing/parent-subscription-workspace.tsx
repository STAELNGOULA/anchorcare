"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import type { ParentBillingSummary } from "@/lib/billing/billing-types";
import { cn } from "@/lib/utils";

type ParentSubscriptionWorkspaceProps = {
  summary: ParentBillingSummary;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function ParentSubscriptionWorkspace({
  summary,
}: ParentSubscriptionWorkspaceProps) {
  const t = useTranslations("parent.you.subscription");
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const isFamily = summary.entitlements.plan === "family";

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success(t("checkoutSuccess"));
    }
  }, [searchParams, t]);

  const runAction = useCallback(
    async (action: "checkout" | "portal") => {
      setPending(true);
      try {
        const res = await fetch("/api/parent/billing", {
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

      <div className="grid gap-4 md:grid-cols-2">
        <BezelCard
          className={cn(
            "flex flex-col justify-between p-6 md:p-8",
            !isFamily && "ring-1 ring-border/60",
          )}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("plans.free")}
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">{t("freePrice")}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{t("freeBullet1")}</li>
              <li>{t("freeBullet2")}</li>
              <li>{t("freeBullet3")}</li>
            </ul>
          </div>
          {!isFamily ? (
            <p className="mt-6 text-sm font-medium text-primary">{t("currentPlan")}</p>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mt-6 min-h-11"
              disabled={pending || !summary.entitlements.subscription}
              onClick={() => runAction("portal")}
            >
              {t("stayOnFree")}
            </Button>
          )}
        </BezelCard>

        <BezelCard
          className={cn(
            "flex flex-col justify-between p-6 md:p-8",
            isFamily && "ring-1 ring-primary/30",
          )}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
              {t("plans.family")}
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">{t("familyPrice")}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{t("familyBullet1")}</li>
              <li>{t("familyBullet2")}</li>
              <li>{t("familyBullet3")}</li>
            </ul>
          </div>
          {isFamily ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-primary">{t("currentPlan")}</p>
              {summary.entitlements.subscription?.currentPeriodEnd ? (
                <p className="text-xs text-muted-foreground">
                  {t("renewsOn", {
                    date: new Date(
                      summary.entitlements.subscription.currentPeriodEnd,
                    ).toLocaleDateString(),
                  })}
                </p>
              ) : null}
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
              {t("upgradeCta")}
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
        href="/parent/you"
        className="inline-flex text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {t("backToYou")}
      </Link>
    </div>
  );
}
