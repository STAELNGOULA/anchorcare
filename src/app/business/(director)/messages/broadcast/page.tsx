import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BroadcastComposer } from "@/components/messaging/broadcast-composer";
import { listBroadcastPrograms } from "@/lib/messaging/broadcast-service";
import { getDirectorContext } from "@/lib/business/director-context";

type PageProps = {
  searchParams: Promise<{ programId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.broadcast");
  return { title: t("metaTitle") };
}

export default async function BusinessBroadcastPage({ searchParams }: PageProps) {
  const { userId, orgId } = await getDirectorContext();
  const params = await searchParams;

  const programs = orgId ? await listBroadcastPrograms(userId, orgId) : [];

  return (
    <BroadcastComposer
      programs={programs}
      initialProgramId={params.programId}
      backHref="/business/messages"
    />
  );
}
