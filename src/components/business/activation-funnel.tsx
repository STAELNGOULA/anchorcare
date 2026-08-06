"use client";

import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";

type ActivationFunnelProps = {
  invited: number;
  registered: number;
  appOpened: number;
  reportRead: number;
};

export function ActivationFunnel({
  invited,
  registered,
  appOpened,
  reportRead,
}: ActivationFunnelProps) {
  const t = useTranslations("business.insights");
  const max = Math.max(invited, registered, appOpened, reportRead, 1);

  const steps = [
    { key: "invited", value: invited },
    { key: "registered", value: registered },
    { key: "appOpened", value: appOpened },
    { key: "reportRead", value: reportRead },
  ] as const;

  return (
    <BezelCard className="p-6 md:p-8">
      <h3 className="font-display text-lg text-foreground">{t("funnelTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("funnelSubtitle")}</p>
      <ul className="mt-6 space-y-4">
        {steps.map((step) => (
          <li key={step.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t(`funnel.${step.key}`)}</span>
              <span className="font-medium text-foreground">{step.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${(step.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </BezelCard>
  );
}
