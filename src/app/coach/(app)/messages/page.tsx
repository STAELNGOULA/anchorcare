import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MessageThreadList } from "@/components/messaging/message-thread-list";
import { PageHeader } from "@/components/business/page-header";
import { listCoachThreads } from "@/lib/messaging/messaging-service";
import { getCoachContext } from "@/lib/coach/coach-context";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.coach");
  return { title: t("metaTitle") };
}

export default async function CoachMessagesPage() {
  await getCoachContext();
  const t = await getTranslations("messaging.coach");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assignments } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", user!.id);

  const programIds = (assignments ?? []).map((a) => a.program_id);
  const threads = await listCoachThreads(user!.id, programIds);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <MessageThreadList threads={threads} basePath="/coach/messages" />
    </div>
  );
}
