import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ProgramDetailWorkspace } from "@/components/business/programs/program-detail-workspace";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { getProgramForDirector } from "@/lib/business/program-service";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Program" };
  const program = await getProgramForDirector(user.id, id);
  return { title: program?.name ?? "Program" };
}

export default async function BusinessProgramDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/business/programs/${id}`);

  const program = await getProgramForDirector(user.id, id);
  if (!program) notFound();

  const orgId = await getDirectorOrgId(user.id);
  const { data: org } = await supabase
    .from("organizations")
    .select("public_slug")
    .eq("id", orgId ?? "")
    .maybeSingle();

  return (
    <ProgramDetailWorkspace
      initialProgram={program}
      orgPublicSlug={org?.public_slug ?? ""}
    />
  );
}
