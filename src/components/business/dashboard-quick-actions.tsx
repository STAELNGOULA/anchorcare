"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Share2 } from "lucide-react";
import type { DashboardAction } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type DashboardQuickActionsProps = {
  actions: DashboardAction[];
  publicPageUrl: string | null;
};

export function DashboardQuickActions({
  actions,
  publicPageUrl,
}: DashboardQuickActionsProps) {
  const t = useTranslations("business.dashboard");
  const [sharing, setSharing] = useState(false);

  const sharePublicPage = async () => {
    if (!publicPageUrl) {
      toast.error(t("action.share-public-page.disabled"));
      return;
    }
    setSharing(true);
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPageUrl}`
        : publicPageUrl;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("action.share-public-page.title"),
          url: absolute,
        });
      } else {
        await navigator.clipboard.writeText(absolute);
        toast.success(t("action.share-public-page.copied"));
      }
    } catch {
      try {
        await navigator.clipboard.writeText(absolute);
        toast.success(t("action.share-public-page.copied"));
      } catch {
        toast.error(t("action.share-public-page.failed"));
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => {
        if (action.id === "share-public-page") {
          return (
            <button
              key={action.id}
              type="button"
              disabled={sharing || !publicPageUrl}
              onClick={() => void sharePublicPage()}
              className="group block w-full text-left"
            >
              <BezelCard
                className={cn(
                  "h-full p-5 transition-[box-shadow,background-color] duration-300 ease-premium md:p-6",
                  "hover:shadow-soft group-hover:bg-secondary/30",
                  action.tone === "accent" && "ring-primary/25",
                )}
              >
                <div className="flex items-start gap-2">
                  <Share2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                  <div>
                    <p className="font-display text-lg text-foreground">
                      {t(`action.${action.id}.title`)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`action.${action.id}.body`)}
                    </p>
                  </div>
                </div>
                <span className="mt-4 inline-flex text-sm font-medium text-primary">
                  {t(`action.${action.id}.cta`)} →
                </span>
              </BezelCard>
            </button>
          );
        }

        return (
          <Link key={action.id} href={action.href} className="group block">
            <BezelCard
              className={cn(
                "h-full p-5 transition-[box-shadow,background-color] duration-300 ease-premium md:p-6",
                "hover:shadow-soft group-hover:bg-secondary/30",
                action.tone === "accent" && "ring-primary/25",
              )}
            >
              <p className="font-display text-lg text-foreground">
                {t(`action.${action.id}.title`)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`action.${action.id}.body`)}
              </p>
              <span className="mt-4 inline-flex text-sm font-medium text-primary group-hover:text-primary/80">
                {t(`action.${action.id}.cta`)} →
              </span>
            </BezelCard>
          </Link>
        );
      })}
    </div>
  );
}
