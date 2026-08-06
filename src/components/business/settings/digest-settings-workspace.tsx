"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OrgDigestSettings } from "@/lib/digest/digest-types";
import {
  buildBusinessDigestHtml,
  buildCoachDigestHtml,
} from "@/lib/digest/digest-email-templates";

const DAY_OPTIONS = [
  { value: 0, key: "sunday" },
  { value: 1, key: "monday" },
  { value: 2, key: "tuesday" },
  { value: 3, key: "wednesday" },
  { value: 4, key: "thursday" },
  { value: 5, key: "friday" },
  { value: 6, key: "saturday" },
] as const;

type DigestSettingsWorkspaceProps = {
  initialSettings: OrgDigestSettings;
  directorEmail: string | null;
  previewMetrics: {
    activationPercent: number;
    reportsThisWeek: number;
    incidents7d: number;
    voiceDaysUsed: number;
    waporPercent: number | null;
    trialDaysLeft: number | null;
    funnelReportRead: number;
    funnelRegistered: number;
    orgName: string;
  };
};

export function DigestSettingsWorkspace({
  initialSettings,
  directorEmail,
  previewMetrics,
}: DigestSettingsWorkspaceProps) {
  const t = useTranslations("business.settings.digest");
  const [settings, setSettings] = useState(initialSettings);
  const [recipientInput, setRecipientInput] = useState(
    initialSettings.businessRecipientEmails.join(", "),
  );
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const dayOptions = useMemo(
    () =>
      DAY_OPTIONS.map((d) => ({
        value: d.value,
        label: t(`days.${d.key}`),
      })),
    [t],
  );

  const save = useCallback(async () => {
    setPending(true);
    try {
      const emails = recipientInput
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

      const res = await fetch("/api/business/settings/digest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessEnabled: settings.businessEnabled,
          businessDeliveryDay: settings.businessDeliveryDay,
          businessRecipientEmails: emails,
          coachDigestEnabled: settings.coachDigestEnabled,
          timezone: settings.timezone,
        }),
      });

      const data = (await res.json()) as { settings?: OrgDigestSettings; error?: string };

      if (!res.ok || !data.settings) {
        toast.error(t("errors.saveFailed"));
        return;
      }

      setSettings(data.settings);
      setRecipientInput(data.settings.businessRecipientEmails.join(", "));
      toast.success(t("saved"));
    } finally {
      setPending(false);
    }
  }, [recipientInput, settings, t]);

  const previewHtml = buildBusinessDigestHtml({
    orgName: previewMetrics.orgName,
    activationPercent: previewMetrics.activationPercent,
    reportsThisWeek: previewMetrics.reportsThisWeek,
    incidents7d: previewMetrics.incidents7d,
    voiceDaysUsed: previewMetrics.voiceDaysUsed,
    waporPercent: previewMetrics.waporPercent,
    trialDaysLeft: previewMetrics.trialDaysLeft,
    funnelReportRead: previewMetrics.funnelReportRead,
    funnelRegistered: previewMetrics.funnelRegistered,
  });

  const coachPreviewHtml = buildCoachDigestHtml("Coach", previewMetrics.reportsThisWeek, 2);

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mx-auto max-w-2xl space-y-8">
        <section className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg">{t("businessTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("businessBody")}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.businessEnabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, businessEnabled: e.target.checked }))
                }
                className="size-4 rounded border-border"
              />
              {t("enabled")}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="digest-day">{t("deliveryDay")}</Label>
              <select
                id="digest-day"
                value={settings.businessDeliveryDay}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    businessDeliveryDay: Number(e.target.value),
                  }))
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {dayOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              id="digest-timezone"
              label={t("timezone")}
              value={settings.timezone}
              onChange={(e) =>
                setSettings((s) => ({ ...s, timezone: e.target.value }))
              }
            />
          </div>

          <TextField
            id="digest-recipients"
            label={t("recipients")}
            hint={directorEmail ? t("recipientsHint", { email: directorEmail }) : t("recipientsHintGeneric")}
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder={t("recipientsPlaceholder")}
          />
        </section>

        <section className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg">{t("coachTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("coachBody")}</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.coachDigestEnabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, coachDigestEnabled: e.target.checked }))
                }
                className="size-4 rounded border-border"
              />
              {t("enabled")}
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => void save()} disabled={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            {previewOpen ? t("hidePreview") : t("preview")}
          </Button>
        </div>

        {previewOpen ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border bg-anchor-sand/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("previewBusiness")}
              </p>
              <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border bg-anchor-sand/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("previewCoach")}
              </p>
              <div className="overflow-hidden rounded-xl bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: coachPreviewHtml }} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
