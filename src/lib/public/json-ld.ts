import type { OrgProfile } from "@/lib/business/org-profile-types";
import type { PublicProgramDetail } from "@/lib/public/public-program-service";

export function buildOrgJsonLd(org: OrgProfile, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ChildCare",
    name: org.publicHeadline || org.name,
    description: org.publicDescription ?? org.publicTagline ?? undefined,
    url: `${siteUrl}/p/${org.publicSlug}`,
    telephone: org.publicPhone ?? undefined,
    email: org.publicEmail ?? undefined,
    image: org.coverImageUrl ?? org.logoUrl ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: org.addressLine1,
      addressLocality: org.city,
      addressRegion: org.region,
      postalCode: org.postalCode,
      addressCountry: org.country,
    },
  };
}

export function buildProgramOfferJsonLd(input: {
  org: OrgProfile;
  program: PublicProgramDetail;
  siteUrl: string;
}) {
  const { org, program, siteUrl } = input;
  const price = (program.priceAmountCents / 100).toFixed(
    program.priceAmountCents % 100 === 0 ? 0 : 2,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: program.publicHeadline,
    description: program.publicDescription ?? program.scheduleSummary ?? undefined,
    url: `${siteUrl}/p/${org.publicSlug}/programs/${program.programSlug}`,
    image: program.heroImageUrl ?? org.coverImageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: program.currency,
      availability:
        program.registrationOpen && program.spotsRemaining !== 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/p/${org.publicSlug}/programs/${program.programSlug}`,
    },
  };
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
