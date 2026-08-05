import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PremiumCta } from "@/components/marketing/premium-cta";

type SectionEmptyProps = {
  title: string;
  body: string;
  cta?: { href: string; label: string };
};

export async function SectionEmpty({ title, body, cta }: SectionEmptyProps) {
  return (
    <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      {cta ? (
        <PremiumCta href={cta.href} showArrow={false}>
          {cta.label}
        </PremiumCta>
      ) : null}
    </BezelCard>
  );
}

export async function SectionEmptyFromKey({
  namespace,
  ctaHref,
}: {
  namespace: "programs" | "people" | "reports" | "settings";
  ctaHref?: string;
}) {
  const t = await getTranslations(`business.${namespace}`);

  return (
    <SectionEmpty
      title={t("emptyTitle")}
      body={t("emptyBody")}
      cta={
        ctaHref
          ? { href: ctaHref, label: t("emptyCta") }
          : undefined
      }
    />
  );
}
