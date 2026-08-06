"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { AllergySeverityStrip } from "@/components/roster/allergy-severity-strip";
import { ClearanceBadge } from "@/components/roster/clearance-badge";
import { StaffEmergencyFullscreen } from "@/components/emergency/staff-emergency-fullscreen";
import { PickupOverrideIndicator } from "@/components/roster/pickup-override-indicator";
import { PickupEtaIndicator } from "@/components/roster/pickup-eta-indicator";
import { ClearanceSummaryPanel } from "@/components/clearance/clearance-summary-panel";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { StaffClearanceSummary } from "@/lib/clearance/clearance-types";
import type { RosterChildDetail } from "@/lib/roster/types";
import { cn } from "@/lib/utils";

type DetailTab = "overview" | "emergency" | "reports" | "incidents" | "messages";

type RosterChildDetailViewProps = {
  child: RosterChildDetail;
  backHref: string;
  showStaffNotes?: boolean;
  clearanceSummary?: StaffClearanceSummary | null;
  messagesHref?: string | null;
};

const TABS: DetailTab[] = [
  "overview",
  "emergency",
  "reports",
  "incidents",
  "messages",
];

export function RosterChildDetailView({
  child,
  backHref,
  showStaffNotes = false,
  clearanceSummary = null,
  messagesHref = null,
}: RosterChildDetailViewProps) {
  const t = useTranslations("roster.detail");
  const [tab, setTab] = useState<DetailTab>("overview");
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1 shrink-0">
            <Link href={backHref} aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <ChildPhoto child={child} />
            <div>
              <h1 className="font-display text-2xl tracking-tight md:text-3xl">
                {child.firstName} {child.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{child.programName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ClearanceBadge status={child.clearanceStatus} />
                <PickupOverrideIndicator override={child.pickupOverride} showCountdown />
                <PickupEtaIndicator eta={child.pickupEta} showCountdown />
              </div>
            </div>
          </div>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setEmergencyOpen(true)}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          {t("emergencyCta")}
        </Button>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-border pb-px"
        aria-label={t("tabsLabel")}
      >
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={tab === key ? "page" : undefined}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <BezelCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("allergies")}
            </h2>
            <AllergySeverityStrip
              items={child.allergyItems}
              allergiesText={child.allergies}
            />
          </BezelCard>
          <BezelCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("enrollment")}
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("status")}</dt>
                <dd className="font-medium capitalize">{child.registrationStatus}</dd>
              </div>
              {child.groupName ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("group")}</dt>
                  <dd className="font-medium">{child.groupName}</dd>
                </div>
              ) : null}
              {child.parentEmail ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("parent")}</dt>
                  <dd className="truncate font-medium">{child.parentEmail}</dd>
                </div>
              ) : null}
            </dl>
          </BezelCard>
          <BezelCard className="space-y-4 p-5 lg:col-span-2">
            <ClearanceSummaryPanel summary={clearanceSummary} />
          </BezelCard>
          {showStaffNotes ? (
            <BezelCard className="space-y-3 p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("staffNotes")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("staffNotesHint")}</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {child.staffNotes?.trim() || t("noStaffNotes")}
              </p>
            </BezelCard>
          ) : null}
        </div>
      ) : null}

      {tab === "emergency" ? (
        <BezelCard className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">{t("emergencyHint")}</p>
          <Button type="button" onClick={() => setEmergencyOpen(true)}>
            <ShieldAlert className="mr-2 h-4 w-4" />
            {t("emergencyCta")}
          </Button>
        </BezelCard>
      ) : null}

      {tab === "reports" || tab === "incidents" ? (
        <EmptyState
          title={t(`placeholders.${tab}.title`)}
          description={t(`placeholders.${tab}.body`)}
        />
      ) : null}

      {tab === "messages" ? (
        messagesHref ? (
          <BezelCard className="space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("placeholders.messages.openBody")}</p>
            <Button asChild className="min-h-11">
              <Link href={messagesHref}>{t("placeholders.messages.openCta")}</Link>
            </Button>
          </BezelCard>
        ) : (
          <EmptyState
            title={t("placeholders.messages.title")}
            description={t("placeholders.messages.body")}
          />
        )
      ) : null}

      <StaffEmergencyFullscreen
        open={emergencyOpen}
        registrationId={child.registrationId}
        onClose={() => setEmergencyOpen(false)}
      />
    </div>
  );
}

function ChildPhoto({ child }: { child: RosterChildDetail }) {
  const initials = `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
      {child.photoSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={child.photoSignedUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}
