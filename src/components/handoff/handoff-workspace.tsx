"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/business/page-header";
import { TextField } from "@/components/forms/text-field";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { HandoffNote } from "@/lib/handoff/handoff-types";

type HandoffWorkspaceProps = {
  programs: { id: string; name: string }[];
  initialNotes: HandoffNote[];
};

export function HandoffWorkspace({ programs, initialNotes }: HandoffWorkspaceProps) {
  const t = useTranslations("business.handoff");
  const [notes, setNotes] = useState(initialNotes);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [noteText, setNoteText] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: p.id, label: p.name })),
    [programs],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/business/handoff-notes", { credentials: "include" });
      const data = (await res.json()) as { notes?: HandoffNote[] };
      if (res.ok) setNotes(data.notes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!programId && programs[0]) setProgramId(programs[0].id);
  }, [programId, programs]);

  const submit = async () => {
    const trimmed = noteText.trim();
    if (!trimmed || !programId) return;
    setPending(true);
    try {
      const res = await fetch("/api/business/handoff-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ programId, note: trimmed }),
      });
      const data = (await res.json()) as { note?: HandoffNote; error?: string };
      if (!res.ok || !data.note) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      setNotes((prev) => [data.note!, ...prev]);
      setNoteText("");
      toast.success(t("saved"));
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setPending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <EmptyState
          title={t("emptyProgramsTitle")}
          description={t("emptyProgramsBody")}
          actionHref="/business/programs/new"
          actionLabel={t("emptyProgramsCta")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <BezelCard className="space-y-5 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-lg text-foreground">{t("composeTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("composeBody")}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="handoff-program">{t("programLabel")}</Label>
            <select
              id="handoff-program"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="flex min-h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {programOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TextField
          id="handoff-note"
          label={t("noteLabel")}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t("notePlaceholder")}
          maxLength={2000}
        />

        <Button
          type="button"
          onClick={() => void submit()}
          disabled={pending || !noteText.trim()}
          className="min-h-11 transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          {pending ? t("saving") : t("save")}
        </Button>
      </BezelCard>

      <section aria-labelledby="handoff-today-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="handoff-today-heading"
            className="font-display text-xl text-foreground md:text-2xl"
          >
            {t("todayTitle")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? t("refreshing") : t("refresh")}
          </Button>
        </div>

        {notes.length === 0 ? (
          <BezelCard className="p-6 text-sm text-muted-foreground">{t("emptyNotes")}</BezelCard>
        ) : (
          <ul className="space-y-3">
            {notes.map((item) => (
              <li key={item.id}>
                <BezelCard className="space-y-2 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{item.programName}</span>
                    <span aria-hidden>·</span>
                    <span>{item.authorName}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{item.note}</p>
                </BezelCard>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
