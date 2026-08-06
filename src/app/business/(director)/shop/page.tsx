import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusinessShopWorkspace } from "@/components/business/shop/business-shop-workspace";
import { listProductsForDirector } from "@/lib/marketplace/marketplace-service";
import type { MarketplaceProduct } from "@/lib/marketplace/marketplace-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("business.shop");
  return { title: t("metaTitle") };
}

export default async function BusinessShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let products: MarketplaceProduct[] = [];
  if (user) {
    const orgId = await getDirectorOrgId(user.id);
    if (orgId) products = await listProductsForDirector(orgId);
  }

  return <BusinessShopWorkspace initialProducts={products} />;
}
