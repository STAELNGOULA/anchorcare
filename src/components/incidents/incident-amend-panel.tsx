"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { AmendIncidentInput, IncidentDetail } from "@/lib/incidents/incident-types";

type IncidentAmendPanelProps = {
  detail: IncidentDetail;
};

export function IncidentAmendPanel({ detail }: IncidentAmendPanelProps) {
  const t = useTranslations("incidents.detail.amend");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState(detail.location ?? "");
  const [symptoms, setSymptoms] = useState(detail.symptoms ?? "");
  const [actionTaken, setActionTaken] = useState(detail.actionTaken ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!detail.canAmend) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border/40">
        {t("windowClosed")}
      </p>
    );
  }

  const submit = async () => {
    if (!reason.trim()) {
      setError(t("reasonRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const payload: AmendIncidentInput = {
        location,
        symptoms,
        actionTaken,
        amendReason: reason.trim(),
      };
      const res = await fetch(`/api/business/incidents/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(t(`errors.${body.error ?? "update_failed"}`));
        return;
      }
      toast.success(t("success"));
      setOpen(false);
      router.refresh();
    } catch {
      setError(t("errors.update_failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-foreground">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          {detail.amendDeadline ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {t("deadline", {
                date: new Date(detail.amendDeadline).toLocaleString(),
              })}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant={open ? "outline" : "default"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("cancel") : t("open")}
        </Button>
      </div>

      {open ? (
        <div className="mt-6 space-y-4">
          <TextField
            id="amend-location"
            label={t("fields.location")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">{t("fields.symptoms")}</span>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">{t("fields.actionTaken")}</span>
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
            />
          </label>
          <TextField
            id="amend-reason"
            label={t("reasonLabel")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="button" onClick={() => void submit()} disabled={pending}>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
