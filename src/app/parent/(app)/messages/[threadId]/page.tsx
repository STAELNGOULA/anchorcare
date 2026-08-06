import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MessageConversation } from "@/components/messaging/message-conversation";
import {
  getThreadForParent,
  getThreadMessages,
} from "@/lib/messaging/messaging-service";
import { getParentContext } from "@/lib/parent/parent-context";

type PageProps = { params: Promise<{ threadId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.conversation");
  return { title: t("metaTitle") };
}

export default async function ParentMessageThreadPage({ params }: PageProps) {
  const { userId } = await getParentContext();
  const { threadId } = await params;

  const thread = await getThreadForParent(userId, threadId);
  if ("error" in thread) notFound();

  const result = await getThreadMessages(userId, threadId, "parent");
  if ("error" in result) notFound();

  return (
    <MessageConversation
      thread={thread}
      initialMessages={result.messages}
      apiBasePath="/api/parent/messages"
      backHref="/parent/messages"
    />
  );
}
