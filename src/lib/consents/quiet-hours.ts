import type { ParentNotificationPreferences } from "@/lib/consents/consent-types";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidQuietHoursTime(value: string): boolean {
  return TIME_RE.test(value);
}

/**
 * Returns true when routine notifications (reports, photos) should be suppressed.
 * Incidents always bypass quiet hours — callers must check incident priority first.
 */
export function isWithinQuietHours(
  prefs: Pick<
    ParentNotificationPreferences,
    "quietHoursEnabled" | "quietHoursStart" | "quietHoursEnd" | "timezone"
  >,
  at: Date = new Date(),
): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: prefs.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const currentMinutes = hour * 60 + minute;

  const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) return false;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
