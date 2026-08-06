import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MessageThreadList } from "@/components/messaging/message-thread-list";
import { PageHeader } from "@/components/business/page-header";
import {
  listParentThreads,
  resolveParentThreadFromContext,
  syncParentThreads,
} from "@/lib/messaging/messaging-service";
import { getParentContext } from "@/lib/parent/parent-context";

type PageProps = {
  searchParams: Promise<{ program?: string; childId?: string; incidentId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.parent");
  return { title: t("metaTitle") };
}

export default async function ParentMessagesPage({ searchParams }: PageProps) {
  const { userId } = await getParentContext();
  const params = await searchParams;
  const t = await getTranslations("messaging.parent");

  if (params.program) {
    const threadId = await resolveParentThreadFromContext(
      userId,
      params.program,
      params.childId,
    );
    if (threadId) {
      redirect(`/parent/messages/${threadId}`);
    }
  }

  await syncParentThreads(userId);
  const threads = await listParentThreads(userId);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <MessageThreadList
        threads={threads}
        basePath="/parent/messages"
        emptyHref="/parent/programs"
      />
    </div>
  );
}
