"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Share2 } from "lucide-react";
import { ConsultChatPanel } from "@/components/consults/consult-chat-panel";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { ConsultDetail } from "@/lib/consults/consult-types";
import { cn } from "@/lib/utils";

type ParentConsultDetailClientProps = {
  consultId: string;
};

export function ParentConsultDetailClient({
  consultId,
}: ParentConsultDetailClientProps) {
  const t = useTranslations("parent.care.consults.detail");
  const [consult, setConsult] = useState<ConsultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/parent/consults/${consultId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setConsult(data.consult);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [consultId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <SkeletonList count={1} />;

  if (error || !consult) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  const clearanceParams = new URLSearchParams();
  clearanceParams.set("childId", consult.childId);
  if (consult.programId) clearanceParams.set("programId", consult.programId);
  if (consult.clearanceStatus) clearanceParams.set("status", consult.clearanceStatus);
  if (consult.carePlanSummary) clearanceParams.set("summary", consult.carePlanSummary);
  if (consult.clearanceConditions) {
    clearanceParams.set("conditions", consult.clearanceConditions);
  }
  if (consult.clearanceExpiresAt) {
    clearanceParams.set("expires", consult.clearanceExpiresAt.slice(0, 10));
  }
  const clearanceHref = `/parent/care/clearance?${clearanceParams.toString()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/parent/care/consults"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <header className="space-y-1">
        <h1 className="font-display text-2xl text-foreground">
          {t("title", { child: consult.childFirstName })}
        </h1>
        <p className="text-sm capitalize text-muted-foreground">
          {t(`status.${consult.status}`)}
          {consult.programName ? ` · ${consult.programName}` : ""}
        </p>
      </header>

      {consult.incident ? (
        <div className="rounded-[1.25rem] bg-card ring-1 ring-border/50">
          <button
            type="button"
            onClick={() => setContextOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
          >
            {t("incidentContext")}
            <span className="text-muted-foreground">{contextOpen ? "−" : "+"}</span>
          </button>
          {contextOpen ? (
            <div className="border-t border-border/40 px-5 py-4 text-sm text-muted-foreground">
              <p>
                {consult.incident.incidentType.replace(/_/g, " ")} ·{" "}
                {consult.incident.severity}
              </p>
              <p className="mt-2">
                {[consult.incident.mechanism, consult.incident.symptoms]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
        <ConsultChatPanel
          consultId={consult.id}
          messages={consult.messages}
          apiBasePath="/api/parent/consults"
          viewerRole="parent"
          disabled={consult.status === "closed"}
          onMessage={() => void load()}
        />
      </div>

      {consult.status === "closed" && consult.carePlanSummary ? (
        <div className="space-y-4 rounded-[1.25rem] bg-primary/5 p-6 ring-1 ring-primary/15">
          <h2 className="font-display text-lg text-foreground">{t("carePlanTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {consult.carePlanSummary}
          </p>
          {consult.clearanceStatus ? (
            <Link
              href={clearanceHref}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground",
                "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98]",
              )}
            >
              <Share2 className="size-4" aria-hidden />
              {t("shareClearance")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
