"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClearancePreviewCard } from "@/components/clearance/clearance-preview-card";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  CLEARANCE_SHARE_STATUSES,
  MAX_CLEARANCE_CONDITIONS_CHARS,
  MAX_CLEARANCE_SUMMARY_CHARS,
  type ClearanceShareStatus,
} from "@/lib/clearance/clearance-constants";
import type {
  ClearanceEnrollmentOption,
  ClearanceShareHistoryItem,
} from "@/lib/clearance/clearance-types";
import { cn } from "@/lib/utils";

type ClearanceShareWorkspaceProps = {
  enrollments: ClearanceEnrollmentOption[];
  history: ClearanceShareHistoryItem[];
};

export function ClearanceShareWorkspace({
  enrollments: initialEnrollments,
  history: initialHistory,
}: ClearanceShareWorkspaceProps) {
  const t = useTranslations("parent.care.clearance");
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillRegistration = searchParams.get("registrationId") ?? "";
  const prefillChild = searchParams.get("childId") ?? "";
  const prefillProgram = searchParams.get("programId") ?? "";
  const prefillIncident = searchParams.get("incidentId") ?? "";
  const prefillStatus = searchParams.get("status") as ClearanceShareStatus | null;
  const prefillSummary = searchParams.get("summary") ?? "";
  const prefillConditions = searchParams.get("conditions") ?? "";
  const prefillExpires = searchParams.get("expires") ?? "";

  const resolvedRegistration =
    prefillRegistration ||
    (prefillChild && prefillProgram
      ? initialEnrollments.find(
          (e) => e.childId === prefillChild && e.programId === prefillProgram,
        )?.registrationId
      : undefined) ||
    initialEnrollments[0]?.registrationId ||
    "";

  const [registrationId, setRegistrationId] = useState(resolvedRegistration);
  const [shareStatus, setShareStatus] = useState<ClearanceShareStatus>(
    prefillStatus &&
      (CLEARANCE_SHARE_STATUSES as readonly string[]).includes(prefillStatus)
      ? prefillStatus
      : "cleared",
  );
  const [summary, setSummary] = useState(prefillSummary);
  const [conditions, setConditions] = useState(prefillConditions);
  const [expiresAt, setExpiresAt] = useState(prefillExpires);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState(initialHistory);

  const selected = useMemo(
    () => initialEnrollments.find((e) => e.registrationId === registrationId),
    [initialEnrollments, registrationId],
  );

  const submit = useCallback(async () => {
    if (!registrationId || !summary.trim()) {
      setError(t("errors.required"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/clearance-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          registrationId,
          shareStatus,
          summary: summary.trim(),
          conditions: conditions.trim() || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          incidentId: prefillIncident || null,
        }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setError(t(`errors.${body.error ?? "create_failed"}`));
        return;
      }
      toast.success(
        t("success", { program: selected?.programName ?? t("preview.programFallback") }),
      );
      const refresh = await fetch("/api/parent/clearance-shares", {
        credentials: "include",
      });
      const data = (await refresh.json()) as {
        history?: ClearanceShareHistoryItem[];
      };
      if (data.history) setHistory(data.history);
      router.refresh();
    } catch {
      setError(t("errors.create_failed"));
    } finally {
      setPending(false);
    }
  }, [
    registrationId,
    summary,
    shareStatus,
    conditions,
    expiresAt,
    prefillIncident,
    selected,
    t,
    router,
  ]);

  if (initialEnrollments.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-card p-8 ring-1 ring-border/50">
        <h2 className="font-display text-xl text-foreground">{t("empty.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("empty.body")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
          <h2 className="font-display text-xl text-foreground">{t("form.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("form.subtitle")}</p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">{t("form.program")}</span>
              <select
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              >
                {initialEnrollments.map((e) => (
                  <option key={e.registrationId} value={e.registrationId}>
                    {e.childFirstName} {e.childLastName} — {e.programName}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t("form.status")}</span>
              <div className="grid gap-2">
                {CLEARANCE_SHARE_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setShareStatus(status)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-left text-sm transition-[background-color,box-shadow,transform] duration-[220ms] ease-out active:scale-[0.98]",
                      shareStatus === status
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-secondary/50 hover:bg-secondary",
                    )}
                  >
                    {t(`status.${status}`)}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">{t("form.summary")}</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={MAX_CLEARANCE_SUMMARY_CHARS}
                rows={4}
                placeholder={t("form.summaryPlaceholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                required
              />
              <span className="text-xs text-muted-foreground">
                {summary.length}/{MAX_CLEARANCE_SUMMARY_CHARS}
              </span>
            </label>

            <TextField
              id="clearance-conditions"
              label={t("form.conditions")}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              maxLength={MAX_CLEARANCE_CONDITIONS_CHARS}
            />

            <TextField
              id="clearance-expires"
              label={t("form.expires")}
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="button" onClick={() => void submit()} disabled={pending}>
              {pending ? t("form.submitting") : t("form.submit")}
            </Button>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
            <h2 className="font-display text-lg text-foreground">{t("history.title")}</h2>
            <ul className="mt-4 space-y-3">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-secondary/30 px-4 py-3 text-sm ring-1 ring-border/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {item.childFirstName} · {item.programName}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium uppercase",
                        item.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.isActive
                        ? t("history.active")
                        : item.isExpired
                          ? t("history.expired")
                          : t("history.inactive")}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {t(`status.${item.shareStatus}`)} ·{" "}
                    {new Date(item.sharedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <ClearancePreviewCard
          shareStatus={shareStatus}
          summary={summary.trim() || t("preview.placeholder")}
          conditions={conditions.trim() || null}
          expiresAt={expiresAt ? new Date(expiresAt).toISOString() : null}
          programName={selected?.programName}
          orgName={selected?.orgName}
        />
      </div>
    </div>
  );
}
