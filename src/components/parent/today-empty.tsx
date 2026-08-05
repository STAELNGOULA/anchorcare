import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PremiumCta } from "@/components/marketing/premium-cta";
import type { ParentContext } from "@/lib/parent/parent-context";

type TodayEmptyProps = {
  context: Pick<ParentContext, "hasLinkedProgram" | "childrenCount">;
};

export async function TodayEmpty({ context }: TodayEmptyProps) {
  const t = await getTranslations("parent.today");

  if (!context.hasLinkedProgram && context.childrenCount === 0) {
    return (
      <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-foreground">
            {t("noProgramTitle")}
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {t("noProgramBody")}
          </p>
        </div>
        <PremiumCta href="/connect" showArrow={false}>
          {t("noProgramCta")}
        </PremiumCta>
      </BezelCard>
    );
  }

  return (
    <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">
          {t("noReportsTitle")}
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("noReportsBody")}
        </p>
      </div>
    </BezelCard>
  );
}
