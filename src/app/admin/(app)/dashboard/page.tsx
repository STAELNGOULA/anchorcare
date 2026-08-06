import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Activity,
  ArrowRight,
  Building2,
  Headphones,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/business/page-header";
import { BezelCard } from "@/components/marketing/bezel-card";
import { getAdminContext } from "@/lib/admin/admin-context";
import { getPlatformDashboard } from "@/lib/admin/platform-service";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("metaTitle") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const context = await getAdminContext();
  const kpis = await getPlatformDashboard();

  const quickLinks = [
    {
      href: "/admin/consults",
      label: t("links.consults"),
      count: kpis.pendingConsults,
      icon: Headphones,
    },
    {
      href: "/admin/moderation",
      label: t("links.moderation"),
      count: kpis.flaggedReports + kpis.openSlugDisputes,
      icon: ShieldAlert,
    },
    {
      href: "/admin/businesses",
      label: t("links.businesses"),
      count: kpis.activeBusinesses,
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader
        title={t("title", { name: context.displayName })}
        subtitle={t("subtitle", { name: context.displayName })}
      />

      <section aria-labelledby="admin-health-heading" className="space-y-4">
        <h2
          id="admin-health-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("healthTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <BezelCard className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="size-4" aria-hidden />
              {t("health.pendingJobs")}
            </div>
            <p className="mt-2 font-display text-3xl text-foreground">
              {kpis.health.pendingJobs}
            </p>
          </BezelCard>
          <BezelCard className="p-6">
            <p className="text-sm text-muted-foreground">{t("health.failedJobs")}</p>
            <p className="mt-2 font-display text-3xl text-foreground">
              {kpis.health.failedJobs}
            </p>
          </BezelCard>
          <BezelCard className="p-6">
            <p className="text-sm text-muted-foreground">{t("health.smsFailure")}</p>
            <p className="mt-2 font-display text-3xl text-foreground">
              {kpis.health.smsFailureRatePercent != null
                ? `${kpis.health.smsFailureRatePercent}%`
                : "—"}
            </p>
          </BezelCard>
        </div>
      </section>

      <section aria-labelledby="admin-queue-heading" className="space-y-4">
        <h2
          id="admin-queue-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("queueSectionTitle")}
        </h2>
        {kpis.pendingConsults > 0 ? (
          <Link
            href="/admin/consults"
            className={cn(
              "flex items-center justify-between rounded-[1.25rem] bg-primary/5 p-6 ring-1 ring-primary/20",
              "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5",
            )}
          >
            <div>
              <p className="font-display text-2xl text-foreground">
                {t("queueActive", { count: kpis.pendingConsults })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("queueActiveBody")}</p>
            </div>
            <ArrowRight className="size-5 text-primary" aria-hidden />
          </Link>
        ) : (
          <BezelCard className="p-8 md:p-10">
            <p className="font-display text-2xl text-foreground">
              {t("queueEmptyTitle")}
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {t("queueEmptyBody")}
            </p>
          </BezelCard>
        )}
      </section>

      <section aria-labelledby="admin-links-heading" className="space-y-4">
        <h2 id="admin-links-heading" className="sr-only">
          {t("linksTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, count, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 transition-[transform] duration-[220ms] ease-out hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="font-display text-lg">{count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="admin-kpi-heading" className="space-y-4">
        <h2
          id="admin-kpi-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("kpiSectionTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t("kpi.mrr.label")} value={kpis.mrrDisplay} />
          <KpiCard
            label={t("kpi.activations.label")}
            value={String(kpis.weeklyActivations)}
            hint={t("kpi.activations.hint")}
          />
          <KpiCard
            label={t("kpi.wapor.label")}
            value={kpis.waporPercent != null ? `${kpis.waporPercent}%` : "—"}
            hint={t("kpi.wapor.hint")}
          />
          <KpiCard
            label={t("kpi.parents.label")}
            value={String(kpis.activeParents)}
            hint={t("kpi.parents.hint")}
          />
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <BezelCard className="p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </BezelCard>
  );
}
