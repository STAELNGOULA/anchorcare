"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { MarketplaceProduct } from "@/lib/marketplace/marketplace-service";
import { formatUsdCents } from "@/lib/money/format-usd";

type ParentMarketplaceWorkspaceProps = {
  products: MarketplaceProduct[];
};

export function ParentMarketplaceWorkspace({ products }: ParentMarketplaceWorkspaceProps) {
  const t = useTranslations("parent.you.marketplace");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const buy = async (productId: string) => {
    setPendingId(productId);
    try {
      const res = await fetch("/api/parent/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json()) as { ok?: boolean; checkoutUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.checkoutUrl) {
        toast.error(t(`errors.${data.error ?? "checkoutFailed"}`));
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error(t("errors.checkoutFailed"));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <li key={product.id}>
              <BezelCard className="space-y-3 p-5">
                <p className="text-xs text-muted-foreground">{product.orgName}</p>
                <p className="font-display text-lg text-foreground">{product.name}</p>
                {product.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                ) : null}
                <p className="font-medium">{formatUsdCents(product.priceCents)}</p>
                <Button
                  type="button"
                  className="w-full rounded-full"
                  disabled={pendingId === product.id}
                  onClick={() => void buy(product.id)}
                >
                  {pendingId === product.id ? t("processing") : t("buy")}
                </Button>
              </BezelCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
