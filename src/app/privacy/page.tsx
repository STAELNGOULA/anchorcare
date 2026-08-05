import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  MarketingBackLink,
  MarketingShell,
} from "@/components/marketing/marketing-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");

  return (
    <MarketingShell>
      <main
        id="main-content"
        className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6 md:pt-32"
      >
        <MarketingBackLink href="/">{t("backHome")}</MarketingBackLink>
        <h1 className="mt-6 font-display text-4xl text-foreground">
          {t("privacyTitle")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {t("privacyIntro")}
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {t("privacyBody")}
        </p>
      </main>
    </MarketingShell>
  );
}
