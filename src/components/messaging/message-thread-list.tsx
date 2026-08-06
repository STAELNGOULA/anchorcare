"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import type { MessageThreadListItem } from "@/lib/messaging/messaging-types";
import { cn } from "@/lib/utils";

type MessageThreadListProps = {
  threads: MessageThreadListItem[];
  basePath: string;
  emptyHref?: string;
};

export function MessageThreadList({ threads, basePath, emptyHref }: MessageThreadListProps) {
  const t = useTranslations("messaging.threads");

  if (threads.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 text-center ring-1 ring-border/50">
        <MessageSquare className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-display text-lg text-foreground">{t("emptyTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
        {emptyHref ? (
          <Link
            href={emptyHref}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
          >
            {t("emptyCta")}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/40 overflow-hidden rounded-[1.25rem] bg-card ring-1 ring-border/50">
      {threads.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`${basePath}/${thread.id}`}
            className={cn(
              "flex min-h-[4.5rem] items-center gap-4 px-5 py-4 transition-[background-color] duration-[220ms] ease-out hover:bg-secondary/40 active:scale-[0.995]",
              thread.unread && "bg-primary/[0.04]",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">
                  {thread.childFirstName} {thread.childLastName}
                </p>
                {thread.unread ? (
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-primary [animation-iteration-count:1]" />
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {thread.programName} · {thread.orgName}
              </p>
              {thread.lastMessagePreview ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {thread.lastMessagePreview}
                </p>
              ) : null}
            </div>
            {thread.lastMessageAt ? (
              <time
                className="shrink-0 text-xs text-muted-foreground"
                dateTime={thread.lastMessageAt}
              >
                {new Date(thread.lastMessageAt).toLocaleDateString()}
              </time>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
