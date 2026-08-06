"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { DashboardChecklistItem } from "@/lib/business/director-context";
import { cn } from "@/lib/utils";

type DashboardChecklistProps = {
  items: DashboardChecklistItem[];
  complete: boolean;
  publicPageUrl?: string | null;
};

export function DashboardChecklist({
  items,
  complete,
  publicPageUrl,
}: DashboardChecklistProps) {
  const t = useTranslations("business.dashboard");
  const [sharing, setSharing] = useState(false);

  if (complete) return null;

  const sharePublicPage = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!publicPageUrl) {
      toast.error(t("action.share-public-page.disabled"));
      return;
    }
    setSharing(true);
    const absolute = `${window.location.origin}${publicPageUrl}`;
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
    <BezelCard className="p-6 md:p-8">
      <div className="space-y-1">
        <h2 className="font-display text-xl text-foreground md:text-2xl">
          {t("checklistTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("checklistSubtitle")}</p>
      </div>
      <ol className="mt-6 space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 transition-[background-color] duration-300 ease-out hover:bg-secondary/60",
                item.done && "opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ring-1 transition-colors duration-300 ease-out",
                  item.done
                    ? "bg-primary/15 text-primary ring-primary/30"
                    : "bg-secondary text-muted-foreground ring-border/60",
                )}
                aria-hidden
              >
                {item.done ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm text-foreground transition-[text-decoration,color] duration-300 ease-out",
                  item.done && "text-muted-foreground line-through decoration-primary/40",
                )}
              >
                {t(`checklist.${item.id}`)}
              </span>
              {item.id === "publicPage" && item.done && publicPageUrl ? (
                <button
                  type="button"
                  disabled={sharing}
                  onClick={(event) => void sharePublicPage(event)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-[background-color,transform] duration-200 ease-out hover:bg-primary/10 active:scale-95"
                  aria-label={t("action.share-public-page.cta")}
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </BezelCard>
  );
}
