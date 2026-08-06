import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MessageConversation } from "@/components/messaging/message-conversation";
import {
  getThreadForStaff,
  getThreadMessages,
} from "@/lib/messaging/messaging-service";
import { getDirectorContext } from "@/lib/business/director-context";

type PageProps = { params: Promise<{ threadId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.conversation");
  return { title: t("metaTitle") };
}

export default async function BusinessMessageThreadPage({ params }: PageProps) {
  const { userId } = await getDirectorContext();
  const { threadId } = await params;

  const thread = await getThreadForStaff(userId, threadId);
  if ("error" in thread) notFound();

  const result = await getThreadMessages(userId, threadId, "staff");
  if ("error" in result) notFound();

  return (
    <MessageConversation
      thread={thread}
      initialMessages={result.messages}
      apiBasePath="/api/business/messages"
      backHref="/business/messages"
    />
  );
}
