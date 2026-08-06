"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/text-field";
import type { TodayChildCard } from "@/lib/parent/today-types";
import { cn } from "@/lib/utils";

const PRESETS = [15, 30, 45] as const;

type RunningLateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: TodayChildCard[];
  onSuccess?: () => void;
};

export function RunningLateModal({
  open,
  onOpenChange,
  children,
  onSuccess,
}: RunningLateModalProps) {
  const t = useTranslations("parent.today.runningLate");
  const enrolled = useMemo(
    () => children.filter((c) => c.registrationStatus && c.programId),
    [children],
  );

  const [childId, setChildId] = useState(enrolled[0]?.childId ?? "");
  const [preset, setPreset] = useState<number | "custom">(15);
  const [customMinutes, setCustomMinutes] = useState("20");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!childId && enrolled[0]) setChildId(enrolled[0].childId);
  }, [open, childId, enrolled]);

  const minutesLate =
    preset === "custom" ? Math.max(1, parseInt(customMinutes, 10) || 1) : preset;

  const submit = async () => {
    if (!childId) return;
    setPending(true);
    try {
      const res = await fetch("/api/parent/pickup-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childId,
          minutesLate,
          note: note.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        eta?: { expectedAt: string; programName?: string | null };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(
          data.error === "noEnrollment" ? t("errors.noEnrollment") : t("errors.failed"),
        );
        return;
      }
      const time = data.eta?.expectedAt
        ? new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(data.eta.expectedAt))
        : "";
      toast.success(t("success", { time }));
      onOpenChange(false);
      setNote("");
      onSuccess?.();
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  };

  const cancelEta = async () => {
    if (!childId) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/parent/pickup-eta?childId=${encodeURIComponent(childId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error(t("errors.failed"));
        return;
      }
      toast.success(t("canceled"));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  };

  const selected = enrolled.find((c) => c.childId === childId);
  const hasActiveEta = Boolean(selected?.pickupEta);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.25rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("title")}</DialogTitle>
        </DialogHeader>

        {enrolled.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noEnrollment")}</p>
        ) : (
          <div className="space-y-5">
            {enrolled.length > 1 ? (
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("childLabel")}
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {enrolled.map((c) => (
                    <option key={c.childId} value={c.childId}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {hasActiveEta ? (
              <div className="flex items-start gap-2 rounded-[0.875rem] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-200" />
                <div className="min-w-0 flex-1 text-sm text-amber-950 dark:text-amber-50">
                  {t("activeEta", {
                    time: new Intl.DateTimeFormat(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(selected!.pickupEta!.expectedAt)),
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("etaLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreset(m)}
                    className={cn(
                      "min-h-11 rounded-full px-4 text-sm transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98]",
                      preset === m
                        ? "bg-foreground text-background"
                        : "bg-card text-muted-foreground ring-1 ring-border/60",
                    )}
                  >
                    {t("presetMinutes", { minutes: m })}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPreset("custom")}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98]",
                    preset === "custom"
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground ring-1 ring-border/60",
                  )}
                >
                  {t("custom")}
                </button>
              </div>
              {preset === "custom" ? (
            <TextField
              id="running-late-custom-minutes"
              label={t("customMinutesLabel")}
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                />
              ) : null}
            </div>

            <TextField
              id="running-late-note"
              label={t("noteLabel")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={200}
            />
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {hasActiveEta ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void cancelEta()}
              disabled={pending}
              className="text-muted-foreground"
            >
              <X className="mr-1 size-4" aria-hidden />
              {t("cancelEta")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("dismiss")}
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={pending || enrolled.length === 0}
            >
              {t("submit")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
