"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ConsultChatPanel } from "@/components/consults/consult-chat-panel";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import {
  CLEARANCE_SHARE_STATUSES,
  type ClearanceShareStatus,
} from "@/lib/clearance/clearance-constants";
import type { ConsultDetail } from "@/lib/consults/consult-types";
import { cn } from "@/lib/utils";

type AdminConsultWorkspaceProps = {
  consultId: string;
};

export function AdminConsultWorkspace({ consultId }: AdminConsultWorkspaceProps) {
  const t = useTranslations("admin.consults.workspace");
  const [consult, setConsult] = useState<ConsultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [closing, setClosing] = useState(false);
  const [carePlanSummary, setCarePlanSummary] = useState("");
  const [clearanceStatus, setClearanceStatus] =
    useState<ClearanceShareStatus>("cleared");
  const [clearanceConditions, setClearanceConditions] = useState("");
  const [clearanceExpiresAt, setClearanceExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/consults/${consultId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setConsult(data.consult);
      if (data.consult?.carePlanSummary) {
        setCarePlanSummary(data.consult.carePlanSummary);
      }
      if (data.consult?.clearanceStatus) {
        setClearanceStatus(data.consult.clearanceStatus);
      }
      if (data.consult?.clearanceConditions) {
        setClearanceConditions(data.consult.clearanceConditions);
      }
      if (data.consult?.clearanceExpiresAt) {
        setClearanceExpiresAt(
          data.consult.clearanceExpiresAt.slice(0, 10),
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [consultId]);

  useEffect(() => {
    void load();
  }, [load]);

  const assign = async () => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/consults/${consultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "assign" }),
      });
      if (!res.ok) {
        toast.error(t("errors.assign_failed"));
        return;
      }
      toast.success(t("assigned"));
      await load();
    } finally {
      setAssigning(false);
    }
  };

  const close = async () => {
    if (!carePlanSummary.trim()) {
      toast.error(t("errors.summary_required"));
      return;
    }
    setClosing(true);
    try {
      const res = await fetch(`/api/admin/consults/${consultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "close",
          carePlanSummary: carePlanSummary.trim(),
          clearanceStatus,
          clearanceConditions: clearanceConditions.trim() || null,
          clearanceExpiresAt: clearanceExpiresAt
            ? new Date(clearanceExpiresAt).toISOString()
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t(`errors.${data.error as string}`) || t("errors.close_failed"));
        return;
      }
      toast.success(t("closed"));
      await load();
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <SkeletonList count={2} />;

  if (error || !consult) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  const canAssign = consult.status === "pending" || consult.status === "assigned";
  const canClose = consult.status !== "closed";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/consults"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            {consult.childFirstName} {consult.childLastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {consult.orgName ?? t("noOrg")}
            {consult.programName ? ` · ${consult.programName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {consult.priority === "high" ? (
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase text-destructive">
              {t("priorityHigh")}
            </span>
          ) : null}
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">
            {t(`status.${consult.status}`)}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside className="space-y-4">
          {consult.incident ? (
            <section className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("incidentTitle")}
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("incidentType")}</dt>
                  <dd className="font-medium capitalize">
                    {consult.incident.incidentType.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("severity")}</dt>
                  <dd className="font-medium">{consult.incident.severity}</dd>
                </div>
                {consult.incident.mechanism ? (
                  <div>
                    <dt className="text-muted-foreground">{t("mechanism")}</dt>
                    <dd>{consult.incident.mechanism}</dd>
                  </div>
                ) : null}
                {consult.incident.symptoms ? (
                  <div>
                    <dt className="text-muted-foreground">{t("symptoms")}</dt>
                    <dd>{consult.incident.symptoms}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          <section className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("timelineTitle")}
            </h2>
            {consult.timelineSnippets.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("timelineEmpty")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {consult.timelineSnippets.map((event) => (
                  <li
                    key={event.id}
                    className="border-l-2 border-primary/30 pl-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{event.title}</p>
                    {event.summary ? (
                      <p className="mt-0.5 text-muted-foreground">{event.summary}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[1.25rem] bg-secondary/30 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("initialRequest")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {consult.initialMessage}
            </p>
          </section>
        </aside>

        <div className="space-y-4">
          {canAssign ? (
            <button
              type="button"
              disabled={assigning}
              onClick={() => void assign()}
              className={cn(
                "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
                "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98] disabled:opacity-60",
              )}
            >
              {assigning ? t("assigning") : t("assignCta")}
            </button>
          ) : null}

          <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
            <ConsultChatPanel
              consultId={consult.id}
              messages={consult.messages}
              apiBasePath="/api/admin/consults"
              viewerRole="admin"
              disabled={consult.status === "closed"}
              onMessage={() => void load()}
            />
          </div>

          {canClose ? (
            <section className="space-y-4 rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
              <h2 className="font-display text-lg text-foreground">{t("closeTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("closeSubtitle")}</p>
              <div className="space-y-2">
                <label htmlFor="care-plan" className="text-sm font-medium">
                  {t("carePlan")}
                </label>
                <textarea
                  id="care-plan"
                  rows={4}
                  value={carePlanSummary}
                  onChange={(e) => setCarePlanSummary(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="clearance" className="text-sm font-medium">
                  {t("clearanceStatus")}
                </label>
                <select
                  id="clearance"
                  value={clearanceStatus}
                  onChange={(e) =>
                    setClearanceStatus(e.target.value as ClearanceShareStatus)
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {CLEARANCE_SHARE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`clearance.${status}`)}
                    </option>
                  ))}
                </select>
              </div>
              {clearanceStatus === "cleared_with_conditions" ? (
                <div className="space-y-2">
                  <label htmlFor="conditions" className="text-sm font-medium">
                    {t("conditions")}
                  </label>
                  <textarea
                    id="conditions"
                    rows={2}
                    value={clearanceConditions}
                    onChange={(e) => setClearanceConditions(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label htmlFor="expires" className="text-sm font-medium">
                  {t("expires")}
                </label>
                <input
                  id="expires"
                  type="date"
                  value={clearanceExpiresAt}
                  onChange={(e) => setClearanceExpiresAt(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={closing}
                onClick={() => void close()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {closing ? t("closing") : t("closeCta")}
              </button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
