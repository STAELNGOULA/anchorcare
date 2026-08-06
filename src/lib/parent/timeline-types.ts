import type { ParentPlan } from "@/lib/parent/parent-context";
import type { TimelineFilter } from "@/lib/parent/timeline-constants";

export type TimelineChildOption = {
  id: string;
  firstName: string;
  lastName: string;
  photoSignedUrl: string | null;
};

export type TimelineEventType =
  | "daily_report"
  | "photo"
  | "incident"
  | "registration"
  | "note"
  | "visit_report";

export type TimelineEventItem = {
  id: string;
  childId: string;
  childFirstName: string;
  eventType: TimelineEventType;
  title: string;
  summary: string | null;
  occurredAt: string;
  programId: string | null;
  programName: string | null;
  orgName: string | null;
  dailyReportId: string | null;
  reportChildId: string | null;
  locked: boolean;
  href: string | null;
};

export type TimelinePage = {
  children: TimelineChildOption[];
  events: TimelineEventItem[];
  nextCursor: string | null;
  plan: ParentPlan;
  freeWindowCutoff: string;
  filter: TimelineFilter;
  childId: string | null;
};
