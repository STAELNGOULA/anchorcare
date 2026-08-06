"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { MarketplaceProduct } from "@/lib/marketplace/marketplace-service";
import { formatUsdCents } from "@/lib/money/format-usd";

type BusinessShopWorkspaceProps = {
  initialProducts: MarketplaceProduct[];
};

export function BusinessShopWorkspace({ initialProducts }: BusinessShopWorkspaceProps) {
  const t = useTranslations("business.shop");
  const [products, setProducts] = useState(initialProducts);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);

  const reload = async () => {
    const res = await fetch("/api/business/marketplace/products", { credentials: "include" });
    const data = (await res.json()) as { products?: MarketplaceProduct[] };
    if (res.ok && data.products) setProducts(data.products);
  };

  const create = async () => {
    const priceCents = Math.round(Number(price) * 100);
    if (!name.trim() || priceCents <= 0) return;
    setPending(true);
    try {
      const res = await fetch("/api/business/marketplace/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          priceCents,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("productCreated"));
      setName("");
      setDescription("");
      setPrice("");
      await reload();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <BezelCard className="space-y-4 p-6">
        <h2 className="font-display text-lg">{t("addProduct")}</h2>
        <TextField id="productName" label={t("productName")} value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          id="productDescription"
          label={t("productDescription")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          id="productPrice"
          label={t("productPrice")}
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button type="button" className="rounded-full" disabled={pending} onClick={() => void create()}>
          {pending ? t("processing") : t("createProduct")}
        </Button>
      </BezelCard>

      <ul className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id}>
            <BezelCard className="p-5 space-y-2">
              <p className="font-display text-lg">{p.name}</p>
              <p className="text-sm text-muted-foreground">{formatUsdCents(p.priceCents)}</p>
            </BezelCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
