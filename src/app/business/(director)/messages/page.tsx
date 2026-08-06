import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Megaphone } from "lucide-react";
import { MessageThreadList } from "@/components/messaging/message-thread-list";
import { PageHeader } from "@/components/business/page-header";
import { Button } from "@/components/ui/button";
import { listStaffThreads } from "@/lib/messaging/messaging-service";
import { getDirectorContext } from "@/lib/business/director-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("messaging.business");
  return { title: t("metaTitle") };
}

export default async function BusinessMessagesPage() {
  const { userId, orgId } = await getDirectorContext();
  const t = await getTranslations("messaging.business");

  if (!orgId) {
    return (
      <PageHeader title={t("title")} subtitle={t("noOrg")} />
    );
  }

  const threads = await listStaffThreads(userId, orgId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <Button asChild className="min-h-11 shrink-0">
          <Link href="/business/messages/broadcast">
            <Megaphone className="mr-2 size-4" aria-hidden />
            {t("broadcastCta")}
          </Link>
        </Button>
      </div>
      <MessageThreadList threads={threads} basePath="/business/messages" />
    </div>
  );
}
