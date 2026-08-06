import { FREE_REPORT_HISTORY_MS } from "@/lib/parent/report-detail-constants";

export const TIMELINE_PAGE_SIZE = 50;

export const TIMELINE_PREFETCH_THRESHOLD = 0.8;

export type TimelineFilter =
  | "all"
  | "reports"
  | "photos"
  | "incidents"
  | "care";

export const TIMELINE_FILTER_TYPES: Record<
  TimelineFilter,
  readonly string[] | null
> = {
  all: null,
  reports: ["daily_report"],
  photos: ["photo"],
  incidents: ["incident"],
  care: ["note", "registration", "visit_report"],
};

export function freeTimelineCutoffIso(): string {
  return new Date(Date.now() - FREE_REPORT_HISTORY_MS).toISOString();
}

export function encodeTimelineCursor(occurredAt: string, id: string): string {
  return Buffer.from(`${occurredAt}|${id}`).toString("base64url");
}

export function decodeTimelineCursor(
  cursor: string,
): { occurredAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const sep = raw.indexOf("|");
    if (sep < 0) return null;
    return {
      occurredAt: raw.slice(0, sep),
      id: raw.slice(sep + 1),
    };
  } catch {
    return null;
  }
}
