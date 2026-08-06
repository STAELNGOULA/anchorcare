import type { HoursJson } from "@/lib/business/org-profile-types";

const DAY_LABELS: Record<keyof HoursJson, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function formatHoursForDisplay(
  hours: HoursJson,
  t: (key: string) => string,
): { day: string; hours: string }[] {
  return (Object.keys(DAY_LABELS) as (keyof HoursJson)[]).map((day) => {
    const entry = hours[day];
    if (entry.closed) {
      return { day: t(`days.${day}`), hours: t("closed") };
    }
    if (!entry.open || !entry.close) {
      return { day: t(`days.${day}`), hours: t("byAppointment") };
    }
    return { day: t(`days.${day}`), hours: `${entry.open} – ${entry.close}` };
  });
}
