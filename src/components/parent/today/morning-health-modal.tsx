"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Home, Thermometer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/text-field";
import type { HealthCheckStatus } from "@/lib/health/health-check-types";
import type { TodayChildCard } from "@/lib/parent/today-types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: {
  value: HealthCheckStatus;
  icon: typeof Check;
  tone: string;
}[] = [
  {
    value: "healthy",
    icon: Check,
    tone: "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15",
  },
  {
    value: "mild_symptoms",
    icon: Thermometer,
    tone: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15",
  },
  {
    value: "staying_home",
    icon: Home,
    tone: "border-red-500/40 bg-red-500/10 hover:bg-red-500/15",
  },
];

type MorningHealthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: TodayChildCard[];
  onSuccess?: () => void;
};

export function MorningHealthModal({
  open,
  onOpenChange,
  children,
  onSuccess,
}: MorningHealthModalProps) {
  const t = useTranslations("parent.today.morningHealth");
  const enrolled = useMemo(
    () => children.filter((c) => c.registrationStatus && c.programId),
    [children],
  );

  const [childId, setChildId] = useState(enrolled[0]?.childId ?? "");
  const [status, setStatus] = useState<HealthCheckStatus | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!childId && enrolled[0]) setChildId(enrolled[0].childId);
    const selected = enrolled.find((c) => c.childId === childId);
    if (selected?.morningHealth) {
      setStatus(selected.morningHealth.healthStatus);
      setNote(selected.morningHealth.note ?? "");
    } else {
      setStatus(null);
      setNote("");
    }
  }, [open, childId, enrolled]);

  const submit = async () => {
    if (!childId || !status) return;
    setPending(true);
    try {
      const res = await fetch("/api/parent/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childId,
          healthStatus: status,
          note: note.trim() || null,
        }),
      });
      const data = (await res.json()) as { check?: unknown; error?: string };
      if (!res.ok) {
        toast.error(
          data.error === "no_program"
            ? t("errors.noEnrollment")
            : t("errors.failed"),
        );
        return;
      }
      toast.success(t(`success.${status}`));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.25rem]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
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

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("statusLabel")}
              </p>
              <div className="grid gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-4 text-left text-sm font-medium transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.98]",
                        opt.tone,
                        selected && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span>{t(`options.${opt.value}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <TextField
              id="morning-health-note"
              label={t("noteLabel")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={500}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
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
            disabled={pending || enrolled.length === 0 || !status}
            className="transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
