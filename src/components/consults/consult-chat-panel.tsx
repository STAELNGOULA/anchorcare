"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ConsultMessage } from "@/lib/consults/consult-types";
import { cn } from "@/lib/utils";

type ConsultChatPanelProps = {
  consultId: string;
  messages: ConsultMessage[];
  apiBasePath: string;
  viewerRole: "parent" | "admin";
  disabled?: boolean;
  onMessage?: (message: ConsultMessage) => void;
};

export function ConsultChatPanel({
  consultId,
  messages: initialMessages,
  apiBasePath,
  viewerRole,
  disabled = false,
  onMessage,
}: ConsultChatPanelProps) {
  const t = useTranslations("consults.chat");
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = body.trim();
    if (!text || disabled) return;
    setPending(true);
    try {
      const res = await fetch(`${apiBasePath}/${consultId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.message) {
        return;
      }
      setMessages((prev) => [...prev, data.message as ConsultMessage]);
      onMessage?.(data.message as ConsultMessage);
      setBody("");
    } finally {
      setPending(false);
    }
  }, [apiBasePath, body, consultId, disabled, onMessage]);

  return (
    <div className="flex min-h-[320px] flex-col">
      <div
        className="flex-1 space-y-3 overflow-y-auto px-1 py-2"
        role="log"
        aria-live="polite"
        aria-label={t("messagesLabel")}
      >
        {messages.map((msg) => {
          const isOwn =
            (viewerRole === "parent" && msg.senderRole === "parent") ||
            (viewerRole === "admin" && msg.senderRole === "admin");
          const isSystem = msg.senderRole === "system";

          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isSystem ? "justify-center" : isOwn ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  isSystem
                    ? "bg-muted/60 text-xs text-muted-foreground"
                    : isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/80 text-foreground",
                )}
              >
                {!isOwn && !isSystem ? (
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {msg.senderLabel}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {!disabled ? (
        <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 4000))}
            placeholder={t("placeholder")}
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm"
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
      ) : (
        <p className="mt-4 text-center text-sm text-muted-foreground">{t("closed")}</p>
      )}
    </div>
  );
}
