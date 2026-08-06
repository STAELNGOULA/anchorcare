import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentMarketplaceWorkspace } from "@/components/parent/marketplace/parent-marketplace-workspace";
import { listProductsForParent } from "@/lib/marketplace/marketplace-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.you.marketplace");
  return { title: t("metaTitle") };
}

export default async function ParentMarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = user ? await listProductsForParent(user.id) : [];

  return <ParentMarketplaceWorkspace products={products} />;
}
