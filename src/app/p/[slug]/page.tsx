import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOrgPage } from "@/components/public/public-org-page";
import { getPublicOrgBySlug } from "@/lib/business/org-profile-service";
import { listPublicProgramsForOrg } from "@/lib/business/program-service";
import { getParentChildren } from "@/lib/invites/parent-children";
import { buildOrgJsonLd, getSiteUrl } from "@/lib/public/json-ld";
import { recordPublicPageEvent } from "@/lib/public/public-program-service";
import { getOrgStripeConnectStatus } from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPublicOrgBySlug(slug);
  if (!org) return { title: "Program not found" };

  const siteUrl = getSiteUrl();

  return {
    title: org.seoTitle ?? org.publicHeadline,
    description: org.seoDescription ?? org.publicTagline ?? undefined,
    openGraph: {
      title: org.seoTitle ?? org.publicHeadline,
      description: org.seoDescription ?? org.publicTagline ?? undefined,
      images: org.coverImageUrl ? [org.coverImageUrl] : org.logoUrl ? [org.logoUrl] : [],
      url: `${siteUrl}/p/${slug}`,
    },
  };
}

export default async function PublicBusinessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  let userId: string | undefined;
  let user: { id: string; email: string } | null = null;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    userId = authUser.id;
    user = { id: authUser.id, email: authUser.email ?? "" };
  }

  const org = await getPublicOrgBySlug(slug, { preview: isPreview, userId });

  if (!org) {
    if (isPreview) notFound();
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F5F0E8] px-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="font-display text-2xl text-[#1B2B4B]">Page not available</h1>
          <p className="text-sm text-[#1B2B4B]/70">
            This program page is not published yet. If you were invited, use your
            direct invite link from the director.
          </p>
        </div>
      </div>
    );
  }

  const connect = await getOrgStripeConnectStatus(org.id);
  const paymentsConfigured = connect.onboarded && connect.chargesEnabled;
  const programs = await listPublicProgramsForOrg(org.id, paymentsConfigured);

  const hasPaidProgramWithoutConnect = programs.some(
    (p) => p.priceAmountCents > 0 && !paymentsConfigured,
  );

  void recordPublicPageEvent({ orgId: org.id, eventType: "view" });

  const parentChildren = user ? await getParentChildren(user.id) : [];
  const jsonLd = buildOrgJsonLd(org, getSiteUrl());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicOrgPage
        org={org}
        programs={programs}
        preview={isPreview}
        paymentsWarning={isPreview && hasPaidProgramWithoutConnect}
        user={user}
        children={parentChildren}
      />
    </>
  );
}
