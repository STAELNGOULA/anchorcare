import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PhaseBadge } from "@/components/shared/phase-badge";
import type { BuildPhase } from "@/lib/navigation/phases";
import { PHASE_LABEL_KEYS } from "@/lib/navigation/phases";

type SurfacePlaceholderProps = {
  namespace: string;
  phase?: BuildPhase;
  specId?: string;
  backHref?: string;
};

export async function SurfacePlaceholder({
  namespace,
  phase = "mvp",
  specId,
  backHref,
}: SurfacePlaceholderProps) {
  const t = await getTranslations(namespace);
  const common = await getTranslations("common");

  return (
    <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
      <div className="flex flex-wrap items-center gap-2">
        <PhaseBadge phase={phase} label={common(PHASE_LABEL_KEYS[phase])} />
        {specId ? (
          <span className="text-xs font-medium text-muted-foreground">{specId}</span>
        ) : null}
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{t("emptyTitle")}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("emptyBody")}
        </p>
      </div>
      {backHref ? (
        <Link
          href={backHref}
          className="text-sm font-medium text-primary transition-colors duration-300 ease-premium hover:text-primary/80"
        >
          {common("backToHub")}
        </Link>
      ) : null}
    </BezelCard>
  );
}
