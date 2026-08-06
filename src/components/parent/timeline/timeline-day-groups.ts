import type { TimelineEventItem } from "@/lib/parent/timeline-types";

export type TimelineDayGroup = {
  dayKey: string;
  dayLabel: string;
  events: TimelineEventItem[];
};

export function groupEventsByDay(
  events: TimelineEventItem[],
  locale?: string,
): TimelineDayGroup[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const groups = new Map<string, TimelineEventItem[]>();

  for (const event of events) {
    const dayKey = event.occurredAt.slice(0, 10);
    const list = groups.get(dayKey) ?? [];
    list.push(event);
    groups.set(dayKey, list);
  }

  return [...groups.entries()].map(([dayKey, dayEvents]) => ({
    dayKey,
    dayLabel: formatter.format(new Date(`${dayKey}T12:00:00`)),
    events: dayEvents,
  }));
}
