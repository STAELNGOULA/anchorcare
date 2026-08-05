import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";
import { getAdminContext } from "@/lib/admin/admin-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("metaTitle") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const context = await getAdminContext();

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        title={t("title", { name: context.displayName })}
        subtitle={t("subtitle", { name: context.displayName })}
      />

      <section aria-labelledby="admin-queue-heading" className="space-y-4">
        <h2
          id="admin-queue-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("queueSectionTitle")}
        </h2>
        <BezelCard className="p-8 md:p-10">
          <p className="font-display text-2xl text-foreground">
            {t("queueEmptyTitle")}
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("queueEmptyBody")}
          </p>
        </BezelCard>
      </section>

      <section aria-labelledby="admin-kpi-heading" className="space-y-4">
        <h2
          id="admin-kpi-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("kpiSectionTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["mrr", "activations", "wapor"] as const).map((key) => (
            <BezelCard key={key} className="p-6">
              <p className="text-sm text-muted-foreground">{t(`kpi.${key}.label`)}</p>
              <p className="mt-2 font-display text-3xl text-foreground">—</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t(`kpi.${key}.pending`)}
              </p>
            </BezelCard>
          ))}
        </div>
      </section>
    </div>
  );
}
