"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BROADCAST_DAILY_LIMIT_PER_PROGRAM,
  MAX_BROADCAST_BODY_CHARS,
} from "@/lib/messaging/messaging-constants";
import type { BroadcastProgramOption } from "@/lib/messaging/messaging-types";
import { cn } from "@/lib/utils";

type BroadcastComposerProps = {
  programs: BroadcastProgramOption[];
  initialProgramId?: string;
  backHref: string;
};

export function BroadcastComposer({
  programs,
  initialProgramId,
  backHref,
}: BroadcastComposerProps) {
  const t = useTranslations("messaging.broadcast");
  const router = useRouter();
  const [programId, setProgramId] = useState(initialProgramId ?? programs[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  const selected = useMemo(
    () => programs.find((p) => p.id === programId),
    [programs, programId],
  );

  const loadQuota = useCallback(async (id: string) => {
    if (!id) return;
    const res = await fetch(`/api/business/messages/broadcast?programId=${id}`, {
      credentials: "include",
    });
    const data = (await res.json()) as { quota?: { used: number; limit: number } };
    if (data.quota) setQuota(data.quota);
  }, []);

  const onProgramChange = (id: string) => {
    setProgramId(id);
    void loadQuota(id);
  };

  useEffect(() => {
    if (programId) void loadQuota(programId);
  }, [programId, loadQuota]);

  const submit = async () => {
    if (!programId || !body.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/business/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ programId, body: body.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        recipientCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(t(`errors.${data.error ?? "send_failed"}`));
        return;
      }
      toast.success(t("success", { count: data.recipientCount ?? 0 }));
      router.push(backHref);
      router.refresh();
    } catch {
      toast.error(t("errors.send_failed"));
    } finally {
      setPending(false);
    }
  };

  if (programs.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 text-center ring-1 ring-border/50">
        <Megaphone className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-sm text-muted-foreground">{t("noPrograms")}</p>
        <Button asChild variant="link" className="mt-2">
          <Link href={backHref}>{t("back")}</Link>
        </Button>
      </div>
    );
  }

  const remaining = quota
    ? Math.max(0, quota.limit - quota.used)
    : BROADCAST_DAILY_LIMIT_PER_PROGRAM;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={backHref} aria-label={t("back")}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-xl text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{t("program")}</span>
          <select
            value={programId}
            onChange={(e) => onProgramChange(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-border/60 bg-background px-4 text-sm"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({t("familyCount", { count: p.activeFamilyCount })})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{t("message")}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BROADCAST_BODY_CHARS))}
            rows={5}
            placeholder={t("placeholder")}
            className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {body.length}/{MAX_BROADCAST_BODY_CHARS}
          </span>
        </label>

        {selected ? (
          <p className="rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            {t("preview", { count: selected.activeFamilyCount, program: selected.name })}
          </p>
        ) : null}

        <p
          className={cn(
            "text-xs",
            remaining === 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {t("quota", { remaining, limit: quota?.limit ?? BROADCAST_DAILY_LIMIT_PER_PROGRAM })}
        </p>

        <Button
          type="button"
          className="min-h-11 w-full"
          disabled={pending || !body.trim() || remaining === 0}
          onClick={() => void submit()}
        >
          {pending ? t("sending") : t("send")}
        </Button>
      </div>
    </div>
  );
}
