import { isWithinQuietHours } from "@/lib/consents/quiet-hours";
import type { ParentNotificationPreferences } from "@/lib/consents/consent-types";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notificationPrefsTable(client: { from: (table: string) => any }): any {
  return client.from("parent_notification_preferences" as "profiles");
}

const DEFAULT_PREFS: ParentNotificationPreferences = {
  pushEnabled: true,
  smsEnabled: true,
  emailDigestEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  timezone: "America/Toronto",
};

export async function getParentNotificationPrefs(
  parentId: string,
): Promise<ParentNotificationPreferences> {
  const service = createServiceClient();
  const { data } = await notificationPrefsTable(service)
    .select(
      "push_enabled, sms_enabled, email_digest_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone",
    )
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_PREFS };

  const start = data.quiet_hours_start?.slice(0, 5) ?? DEFAULT_PREFS.quietHoursStart;
  const end = data.quiet_hours_end?.slice(0, 5) ?? DEFAULT_PREFS.quietHoursEnd;

  return {
    pushEnabled: Boolean(data.push_enabled),
    smsEnabled: Boolean(data.sms_enabled),
    emailDigestEnabled: Boolean(data.email_digest_enabled),
    quietHoursEnabled: Boolean(data.quiet_hours_enabled),
    quietHoursStart: start,
    quietHoursEnd: end,
    timezone: data.timezone ?? DEFAULT_PREFS.timezone,
  };
}

/**
 * Routine pushes (reports, photos, messages) respect quiet hours.
 * Incidents and safety alerts must call with `incidentOrSafety: true` to bypass.
 */
export async function shouldDeliverRoutinePush(
  parentId: string,
  at: Date = new Date(),
): Promise<boolean> {
  const prefs = await getParentNotificationPrefs(parentId);
  if (!prefs.pushEnabled) return false;
  if (!prefs.quietHoursEnabled) return true;
  return !isWithinQuietHours(prefs, at);
}

/**
 * SMS for incidents always delivers — routine SMS can respect quiet hours.
 */
export async function shouldDeliverRoutineSms(
  parentId: string,
  at: Date = new Date(),
): Promise<boolean> {
  const prefs = await getParentNotificationPrefs(parentId);
  if (!prefs.smsEnabled) return false;
  if (!prefs.quietHoursEnabled) return true;
  return !isWithinQuietHours(prefs, at);
}
