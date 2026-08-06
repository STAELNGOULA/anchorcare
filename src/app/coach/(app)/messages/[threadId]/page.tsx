import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MessageConversation } from "@/components/messaging/message-conversation";
import {
  getThreadForStaff,
  getThreadMessages,
} from "@/lib/messaging/messaging-service";
import { getCoachContext } from "@/lib/coach/coach-context";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ threadId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.conversation");
  return { title: t("metaTitle") };
}

export default async function CoachMessageThreadPage({ params }: PageProps) {
  await getCoachContext();
  const { threadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const thread = await getThreadForStaff(user!.id, threadId);
  if ("error" in thread) notFound();

  const result = await getThreadMessages(user!.id, threadId, "staff");
  if ("error" in result) notFound();

  return (
    <MessageConversation
      thread={thread}
      initialMessages={result.messages}
      apiBasePath="/api/coach/messages"
      backHref="/coach/messages"
    />
  );
}
