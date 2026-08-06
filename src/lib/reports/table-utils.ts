import { createServiceClient } from "@/lib/supabase/service";

// Tables not yet in generated Supabase types — cast via known table name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reportsTable(client: { from: (table: string) => any }): any {
  return client.from("daily_reports" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reportChildrenTable(client: { from: (table: string) => any }): any {
  return client.from("report_children" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timelineEventsTable(client: { from: (table: string) => any }): any {
  return client.from("timeline_events" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mediaAssetsTable(client: { from: (table: string) => any }): any {
  return client.from("media_assets" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mediaChildTagsTable(client: { from: (table: string) => any }): any {
  return client.from("media_child_tags" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function incidentsTable(client: { from: (table: string) => any }): any {
  return client.from("incidents" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function incidentAuditLogTable(client: { from: (table: string) => any }): any {
  return client.from("incident_audit_log" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function incidentPhotosTable(client: { from: (table: string) => any }): any {
  return client.from("incident_photos" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearanceSharesTable(client: { from: (table: string) => any }): any {
  return client.from("clearance_shares" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function messageThreadsTable(client: { from: (table: string) => any }): any {
  return client.from("message_threads" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function messagesTable(client: { from: (table: string) => any }): any {
  return client.from("messages" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function messageBroadcastsTable(client: { from: (table: string) => any }): any {
  return client.from("message_broadcasts" as "program_registrations");
}

export function todayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function serviceClient() {
  return createServiceClient();
}
