"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { IncidentAmendPanel } from "@/components/incidents/incident-amend-panel";
import { IncidentAuditTimeline } from "@/components/incidents/incident-audit-timeline";
import { IncidentPdfExportPanel } from "@/components/incidents/incident-pdf-export-panel";
import { ParentIncidentActionBar } from "@/components/incidents/parent-incident-action-bar";
import type { IncidentDetail } from "@/lib/incidents/incident-types";
import { cn } from "@/lib/utils";

type IncidentDetailWorkspaceProps = {
  detail: IncidentDetail;
  backHref: string;
};

function severityTone(isRed: boolean, severity: string) {
  if (isRed || severity === "red") return "bg-destructive/10 text-destructive";
  if (severity === "yellow") return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
}

export function IncidentDetailWorkspace({
  detail,
  backHref,
}: IncidentDetailWorkspaceProps) {
  const t = useTranslations("incidents.detail");

  const childName = `${detail.childFirstName} ${detail.childLastName}`.trim();
  const typeLabel = detail.incidentType.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <header
        className={cn(
          "space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8",
          detail.isRedFlag && "ring-destructive/20",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              severityTone(detail.isRedFlag, detail.severity),
            )}
          >
            {detail.isRedFlag ? (
              <AlertTriangle className="size-3" aria-hidden />
            ) : null}
            {t(`severity.${detail.severity}`)}
          </span>
          {detail.status === "amended" ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              {t("amendedBadge")}
            </span>
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-2xl text-foreground capitalize">
            {typeLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {childName} · {detail.programName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(detail.occurredAt))}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("fields.location")}</dt>
            <dd className="font-medium text-foreground">{detail.location ?? "—"}</dd>
          </div>
          {detail.bodyArea ? (
            <div>
              <dt className="text-muted-foreground">{t("fields.bodyArea")}</dt>
              <dd className="font-medium capitalize text-foreground">
                {detail.bodyArea.replace(/_/g, " ")}
              </dd>
            </div>
          ) : null}
          {detail.mechanism ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t("fields.mechanism")}</dt>
              <dd className="font-medium text-foreground">{detail.mechanism}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{t("fields.symptoms")}</dt>
            <dd className="mt-1 leading-relaxed text-foreground">{detail.symptoms ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{t("fields.actionTaken")}</dt>
            <dd className="mt-1 leading-relaxed text-foreground">
              {detail.actionTaken ?? "—"}
            </dd>
          </div>
          {detail.witnesses.length > 0 ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t("fields.witnesses")}</dt>
              <dd className="mt-1 text-foreground">
                {detail.witnesses
                  .map((w) => `${w.name}${w.role ? ` (${w.role})` : ""}`)
                  .join(", ")}
              </dd>
            </div>
          ) : null}
        </dl>

        {detail.parentNotifiedAt ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {t("parentNotified", {
              time: new Date(detail.parentNotifiedAt).toLocaleString(),
            })}
          </p>
        ) : null}
      </header>

      {detail.role === "parent" ? (
        <ParentIncidentActionBar detail={detail} />
      ) : null}

      {detail.role === "director" ? <IncidentAmendPanel detail={detail} /> : null}

      {detail.role === "director" ? (
        <IncidentPdfExportPanel incidentId={detail.id} />
      ) : null}

      {detail.role === "coach" ? (
        <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t("coachReadOnly")}
        </p>
      ) : null}

      {detail.photos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-foreground">{t("photos")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {detail.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-border/50"
              >
                <Image
                  src={photo.signedUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
        <h2 className="font-display text-lg text-foreground">{t("auditTitle")}</h2>
        <IncidentAuditTimeline
          entries={detail.auditTrail}
          showDiff={detail.role === "parent" || detail.role === "director"}
        />
      </section>
    </div>
  );
}
