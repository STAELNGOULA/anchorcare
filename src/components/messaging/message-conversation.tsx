"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MessageItem, MessageThreadDetail } from "@/lib/messaging/messaging-types";
import { MAX_MESSAGE_BODY_CHARS } from "@/lib/messaging/messaging-constants";
import { cn } from "@/lib/utils";

type MessageConversationProps = {
  thread: MessageThreadDetail;
  initialMessages: MessageItem[];
  apiBasePath: string;
  backHref: string;
};

export function MessageConversation({
  thread,
  initialMessages,
  apiBasePath,
  backHref,
}: MessageConversationProps) {
  const t = useTranslations("messaging.conversation");
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = body.trim();
    if (!text) return;
    setPending(true);
    try {
      const res = await fetch(`${apiBasePath}/${thread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: MessageItem;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.message) {
        toast.error(t(`errors.${data.error ?? "send_failed"}`));
        return;
      }
      setMessages((prev) => [...prev, data.message!]);
      setBody("");
    } catch {
      toast.error(t("errors.send_failed"));
    } finally {
      setPending(false);
    }
  }, [apiBasePath, body, t, thread.id]);

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={backHref} aria-label={t("back")}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg text-foreground">
            {thread.childFirstName} {thread.childLastName}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {thread.programName} · {thread.orgName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Shield className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>{t("safetyBanner", { child: thread.childFirstName })}</p>
      </div>

      <div
        className="mt-4 flex-1 space-y-3 overflow-y-auto px-1 py-2"
        role="log"
        aria-live="polite"
        aria-label={t("messagesLabel")}
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_MESSAGE_BODY_CHARS))}
          placeholder={t("placeholder")}
          rows={2}
          className="min-h-11 flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="size-11 shrink-0"
          disabled={pending || !body.trim()}
          onClick={() => void send()}
          aria-label={t("send")}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: MessageItem }) {
  const t = useTranslations("messaging.conversation");
  const isBroadcast = message.messageType === "broadcast";

  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 duration-[220ms] ease-out",
        message.isOwn ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          message.isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-secondary/80 text-foreground",
          isBroadcast && !message.isOwn && "ring-1 ring-primary/20",
        )}
      >
        {!message.isOwn ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
            {isBroadcast ? t("broadcastLabel") : message.senderLabel}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <time
          className="mt-1 block text-[10px] opacity-60"
          dateTime={message.createdAt}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
