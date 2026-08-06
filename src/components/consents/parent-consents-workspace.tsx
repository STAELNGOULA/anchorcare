"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConsentToggle } from "@/components/forms/consent-toggle";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/business/page-header";
import type {
  ParentNotificationPreferences,
  ProgramConsentItem,
} from "@/lib/consents/consent-types";
import { QUIET_HOURS_TIMEZONE_OPTIONS } from "@/lib/consents/timezone-options";
import { cn } from "@/lib/utils";

type ParentConsentsWorkspaceProps = {
  programs: ProgramConsentItem[];
  notifications: ParentNotificationPreferences;
};

export function ParentConsentsWorkspace({
  programs: initialPrograms,
  notifications: initialNotifications,
}: ParentConsentsWorkspaceProps) {
  const t = useTranslations("parent.you.consents");
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pending, setPending] = useState(false);

  const updateProgram = useCallback(
    async (
      registrationId: string,
      patch: Partial<
        Pick<ProgramConsentItem, "sharePhotos" | "shareMedical" | "shareEmergency">
      >,
    ) => {
      setPending(true);
      try {
        const res = await fetch("/api/parent/consents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            scope: "program",
            program: { registrationId, ...patch },
          }),
        });
        if (!res.ok) {
          toast.error(t("errors.saveFailed"));
          return;
        }
        setPrograms((prev) =>
          prev.map((item) =>
            item.registrationId === registrationId ? { ...item, ...patch } : item,
          ),
        );
        toast.success(t("saved"));
        router.refresh();
      } catch {
        toast.error(t("errors.saveFailed"));
      } finally {
        setPending(false);
      }
    },
    [router, t],
  );

  const updateNotifications = useCallback(
    async (patch: Partial<ParentNotificationPreferences>) => {
      setPending(true);
      try {
        const res = await fetch("/api/parent/consents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            scope: "notifications",
            notifications: {
              pushEnabled: patch.pushEnabled,
              smsEnabled: patch.smsEnabled,
              emailDigestEnabled: patch.emailDigestEnabled,
              quietHoursEnabled: patch.quietHoursEnabled,
              quietHoursStart: patch.quietHoursStart,
              quietHoursEnd: patch.quietHoursEnd,
              timezone: patch.timezone,
            },
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          notifications?: ParentNotificationPreferences;
        };
        if (!res.ok || !data.notifications) {
          toast.error(t("errors.saveFailed"));
          return;
        }
        setNotifications(data.notifications);
        toast.success(t("saved"));
      } catch {
        toast.error(t("errors.saveFailed"));
      } finally {
        setPending(false);
      }
    },
    [t],
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section aria-labelledby="consents-programs-heading">
        <h2
          id="consents-programs-heading"
          className="font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {t("sections.programs")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("programsIntro")}</p>

        {programs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyBody")}
              actionHref="/parent/programs"
              actionLabel={t("emptyCta")}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {programs.map((item) => (
              <BezelCard key={item.registrationId} className="space-y-4 p-5 md:p-6">
                <div>
                  <p className="font-display text-lg text-foreground">
                    {item.childName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.programName} · {item.orgName}
                  </p>
                </div>
                <ConsentToggle
                  label={t("sharePhotos")}
                  description={t("sharePhotosHint")}
                  checked={item.sharePhotos}
                  disabled={pending}
                  onChange={(sharePhotos) =>
                    updateProgram(item.registrationId, { sharePhotos })
                  }
                />
                <ConsentToggle
                  label={t("shareMedical")}
                  description={t("shareMedicalHint")}
                  checked={item.shareMedical}
                  disabled={pending}
                  onChange={(shareMedical) =>
                    updateProgram(item.registrationId, { shareMedical })
                  }
                />
                <ConsentToggle
                  label={t("shareEmergency")}
                  description={t("shareEmergencyHint")}
                  checked={item.shareEmergency}
                  disabled={pending}
                  onChange={(shareEmergency) =>
                    updateProgram(item.registrationId, { shareEmergency })
                  }
                />
              </BezelCard>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="consents-notifications-heading">
        <h2
          id="consents-notifications-heading"
          className="font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {t("sections.notifications")}
        </h2>
        <BezelCard className="mt-3 space-y-4 p-5 md:p-6">
          <ConsentToggle
            label={t("pushEnabled")}
            description={t("pushEnabledHint")}
            checked={notifications.pushEnabled}
            disabled={pending}
            onChange={(pushEnabled) => updateNotifications({ pushEnabled })}
          />
          <ConsentToggle
            label={t("smsEnabled")}
            description={t("smsEnabledHint")}
            checked={notifications.smsEnabled}
            disabled={pending}
            onChange={(smsEnabled) => updateNotifications({ smsEnabled })}
          />
          <ConsentToggle
            label={t("emailDigest")}
            description={t("emailDigestHint")}
            checked={notifications.emailDigestEnabled}
            disabled={pending}
            onChange={(emailDigestEnabled) =>
              updateNotifications({ emailDigestEnabled })
            }
          />
        </BezelCard>
      </section>

      <section aria-labelledby="consents-quiet-hours-heading">
        <h2
          id="consents-quiet-hours-heading"
          className="font-display text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {t("sections.quietHours")}
        </h2>
        <div
          className={cn(
            "mt-3 rounded-[1rem] border border-primary/20 bg-primary/6 px-4 py-3 text-sm text-foreground",
          )}
          role="note"
        >
          {t("incidentBypass")}
        </div>
        <BezelCard className="mt-3 space-y-4 p-5 md:p-6">
          <ConsentToggle
            label={t("quietHoursEnabled")}
            description={t("quietHoursEnabledHint")}
            checked={notifications.quietHoursEnabled}
            disabled={pending}
            onChange={(quietHoursEnabled) =>
              updateNotifications({ quietHoursEnabled })
            }
          />
          {notifications.quietHoursEnabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t("quietHoursStart")}
                </span>
                <input
                  type="time"
                  value={notifications.quietHoursStart}
                  disabled={pending}
                  onChange={(e) =>
                    updateNotifications({ quietHoursStart: e.target.value })
                  }
                  className="flex min-h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t("quietHoursEnd")}
                </span>
                <input
                  type="time"
                  value={notifications.quietHoursEnd}
                  disabled={pending}
                  onChange={(e) =>
                    updateNotifications({ quietHoursEnd: e.target.value })
                  }
                  className="flex min-h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">
                  {t("timezone")}
                </span>
                <select
                  value={notifications.timezone}
                  disabled={pending}
                  onChange={(e) =>
                    updateNotifications({ timezone: e.target.value })
                  }
                  className="flex min-h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {QUIET_HOURS_TIMEZONE_OPTIONS.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">{t("timezoneHint")}</span>
              </label>
            </div>
          ) : null}
        </BezelCard>
      </section>

      <Link
        href="/parent/you"
        className="inline-flex text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {t("backToYou")}
      </Link>
    </div>
  );
}
