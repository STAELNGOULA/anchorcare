import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProgramPageClient } from "@/components/public/public-program-page";
import { getPublicOrgBySlug } from "@/lib/business/org-profile-service";
import { getParentChildren } from "@/lib/invites/parent-children";
import {
  buildProgramOfferJsonLd,
  getSiteUrl,
} from "@/lib/public/json-ld";
import {
  getPublicProgramBySlug,
  recordPublicPageEvent,
} from "@/lib/public/public-program-service";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string; programSlug: string }>;
  searchParams: Promise<{ preview?: string; enrolled?: string; checkout?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, programSlug } = await params;
  const program = await getPublicProgramBySlug(slug, programSlug);
  if (!program) return { title: "Program not found" };

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/p/${slug}/programs/${programSlug}`;

  return {
    title: program.publicHeadline,
    description: program.publicDescription ?? program.scheduleSummary ?? undefined,
    openGraph: {
      title: program.publicHeadline,
      description: program.publicDescription ?? undefined,
      images: program.heroImageUrl ? [program.heroImageUrl] : [],
      url,
    },
  };
}

export default async function PublicProgramPage({ params, searchParams }: PageProps) {
  const { slug, programSlug } = await params;
  const { preview, enrolled } = await searchParams;
  const isPreview = preview === "1";

  let userId: string | undefined;
  let user: { id: string; email: string } | null = null;

  const supabase = await createClient();
  const {
    data: { sessionUser },
  } = await supabase.auth.getUser().then((r) => ({ data: { sessionUser: r.data.user } }));

  if (sessionUser) {
    userId = sessionUser.id;
    user = { id: sessionUser.id, email: sessionUser.email ?? "" };
  }

  const program = await getPublicProgramBySlug(slug, programSlug, {
    preview: isPreview,
    userId,
  });

  if (!program) {
    if (isPreview) notFound();
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F5F0E8] px-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="font-display text-2xl text-[#1B2B4B]">Program not available</h1>
          <p className="text-sm text-[#1B2B4B]/70">
            This program is not published yet.
          </p>
        </div>
      </div>
    );
  }

  const org = await getPublicOrgBySlug(slug, { preview: isPreview, userId });
  if (!org) notFound();

  void recordPublicPageEvent({
    orgId: org.id,
    programId: program.id,
    eventType: "program_click",
  });

  const parentChildren = user ? await getParentChildren(user.id) : [];
  const jsonLd = buildProgramOfferJsonLd({ org, program, siteUrl: getSiteUrl() });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicProgramPageClient
        program={program}
        accentColor={org.brandAccentColor}
        user={user}
        children={parentChildren}
        enrolled={enrolled === "1"}
      />
    </>
  );
}
