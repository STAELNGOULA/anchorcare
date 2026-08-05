import type { FaqItem } from "@/components/marketing/faq-section";
import type { PricingPlan } from "@/components/marketing/pricing-section";

type TranslateFn = (key: string) => string;

function buildProgramPlan(t: TranslateFn, highlighted: boolean): PricingPlan {
  return {
    name: t("pricingProgramsName"),
    price: t("pricingProgramsPrice"),
    period: t("pricingProgramsPeriod"),
    description: t("pricingProgramsDescription"),
    features: Array.from({ length: 6 }, (_, i) =>
      t(`pricingProgramsFeature${i + 1}`),
    ),
    cta: { href: "/sign-up?intent=program", label: t("pricingProgramsCta") },
    highlighted,
  };
}

function buildFamilyPlan(t: TranslateFn, highlighted: boolean): PricingPlan {
  return {
    name: t("pricingParentsName"),
    price: t("pricingParentsPrice"),
    period: t("pricingParentsPeriod"),
    annualNote: t("pricingParentsAnnual"),
    description: t("pricingParentsDescription"),
    features: Array.from({ length: 6 }, (_, i) =>
      t(`pricingParentsFeature${i + 1}`),
    ),
    cta: { href: "/login", label: t("pricingParentsCta") },
    highlighted,
  };
}

export function buildHomePricingPlans(t: TranslateFn): PricingPlan[] {
  return [buildProgramPlan(t, true), buildFamilyPlan(t, false)];
}

export function buildProgramsPricingPlans(t: TranslateFn): PricingPlan[] {
  return [buildProgramPlan(t, true)];
}

export function buildParentsPricingPlans(t: TranslateFn): PricingPlan[] {
  return [buildFamilyPlan(t, true)];
}

/** Build FAQ items from next-intl keyed entries faq1Q/faq1A … faqNQ/faqNA */
export function buildFaqItems(
  t: (key: string) => string,
  count: number,
): FaqItem[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return {
      question: t(`faq${n}Q`),
      answer: t(`faq${n}A`),
    };
  });
}

export function buildSteps(
  t: (key: string) => string,
  count: number,
): { title: string; body: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return { title: t(`step${n}Title`), body: t(`step${n}Body`) };
  });
}

export function buildFeatures(
  t: (key: string) => string,
  count: number,
): { title: string; body: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return { title: t(`feature${n}Title`), body: t(`feature${n}Body`) };
  });
}

export function buildPainPoints(
  t: (key: string) => string,
  count: number,
): { title: string; body: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return { title: t(`pain${n}Title`), body: t(`pain${n}Body`) };
  });
}

export function buildRetentionItems(
  t: (key: string) => string,
  count: number,
): { title: string; body: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    return { title: t(`retention${n}Title`), body: t(`retention${n}Body`) };
  });
}
