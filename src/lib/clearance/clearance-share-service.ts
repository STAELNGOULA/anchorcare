import {
  CLEARANCE_SHARE_STATUSES,
  MAX_CLEARANCE_CONDITIONS_CHARS,
  MAX_CLEARANCE_SUMMARY_CHARS,
  type ClearanceShareStatus,
} from "@/lib/clearance/clearance-constants";
import type {
  ClearanceEnrollmentOption,
  ClearanceShareHistoryItem,
  CreateClearanceShareInput,
  StaffClearanceSummary,
} from "@/lib/clearance/clearance-types";
import { enqueueJob } from "@/lib/jobs/queue";
import { clearanceSharesTable, incidentsTable } from "@/lib/reports/table-utils";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ShareRow = {
  id: string;
  org_id: string;
  program_id: string;
  registration_id: string;
  child_id: string;
  parent_id: string;
  incident_id: string | null;
  share_status: ClearanceShareStatus;
  summary: string;
  conditions: string | null;
  expires_at: string | null;
  shared_at: string;
  revoked_at: string | null;
};

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function isActive(row: ShareRow): boolean {
  return !row.revoked_at && !isExpired(row.expires_at);
}

function mapHistoryItem(
  row: ShareRow,
  programName: string,
  childFirstName: string,
): ClearanceShareHistoryItem {
  const expired = isExpired(row.expires_at);
  return {
    id: row.id,
    registrationId: row.registration_id,
    programName,
    childFirstName,
    shareStatus: row.share_status,
    summary: row.summary,
    conditions: row.conditions,
    expiresAt: row.expires_at,
    sharedAt: row.shared_at,
    isActive: isActive(row),
    isExpired: expired,
  };
}

export async function listParentClearanceEnrollments(
  parentId: string,
): Promise<ClearanceEnrollmentOption[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("program_registrations")
    .select(
      `
      id,
      org_id,
      program_id,
      child_id,
      children(first_name, last_name),
      programs(name, organizations(name))
    `,
    )
    .eq("parent_id", parentId)
    .eq("status", "active");

  return (data ?? []).map((row) => {
    const child = row.children as { first_name: string; last_name: string } | null;
    const program = row.programs as {
      name: string;
      organizations: { name: string } | null;
    } | null;
    return {
      registrationId: row.id,
      childId: row.child_id,
      childFirstName: child?.first_name ?? "",
      childLastName: child?.last_name ?? "",
      programId: row.program_id,
      orgId: row.org_id,
      programName: program?.name ?? "",
      orgName: program?.organizations?.name ?? "",
    };
  });
}

export async function listParentClearanceHistory(
  parentId: string,
): Promise<ClearanceShareHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await clearanceSharesTable(supabase)
    .select(
      `
      id, registration_id, share_status, summary, conditions,
      expires_at, shared_at, revoked_at,
      programs(name),
      children(first_name)
    `,
    )
    .eq("parent_id", parentId)
    .order("shared_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return ((data ?? []) as unknown[]).map((raw) => {
    const row = raw as ShareRow & {
      programs: { name: string } | null;
      children: { first_name: string } | null;
    };
    return mapHistoryItem(
      row,
      row.programs?.name ?? "",
      row.children?.first_name ?? "",
    );
  });
}

export async function createClearanceShare(
  parentId: string,
  input: CreateClearanceShareInput,
): Promise<{ shareId: string } | { error: string }> {
  if (!CLEARANCE_SHARE_STATUSES.includes(input.shareStatus)) {
    return { error: "invalid_status" };
  }

  const summary = input.summary.trim();
  if (!summary || summary.length > MAX_CLEARANCE_SUMMARY_CHARS) {
    return { error: "invalid_summary" };
  }

  const conditions = input.conditions?.trim() || null;
  if (conditions && conditions.length > MAX_CLEARANCE_CONDITIONS_CHARS) {
    return { error: "invalid_conditions" };
  }

  if (input.expiresAt && new Date(input.expiresAt).getTime() <= Date.now()) {
    return { error: "expiry_in_past" };
  }

  const service = createServiceClient();
  const { data: reg } = await service
    .from("program_registrations")
    .select("id, org_id, program_id, child_id, parent_id, status")
    .eq("id", input.registrationId)
    .maybeSingle();

  if (!reg || reg.parent_id !== parentId || reg.status !== "active") {
    return { error: "registration_not_found" };
  }

  if (input.incidentId) {
    const { data: incident } = await incidentsTable(service)
      .select("id, child_id")
      .eq("id", input.incidentId)
      .maybeSingle();
    if (!incident || incident.child_id !== reg.child_id) {
      return { error: "invalid_incident" };
    }
  }

  const { data: share, error } = await clearanceSharesTable(service)
    .insert({
      org_id: reg.org_id,
      program_id: reg.program_id,
      registration_id: reg.id,
      child_id: reg.child_id,
      parent_id: parentId,
      incident_id: input.incidentId ?? null,
      share_status: input.shareStatus,
      summary,
      conditions,
      expires_at: input.expiresAt ?? null,
    })
    .select("id")
    .single();

  if (error || !share) return { error: "create_failed" };

  await enqueueJob({
    type: "clearance_share_notify_business",
    payload: {
      shareId: share.id,
      registrationId: reg.id,
      orgId: reg.org_id,
      programId: reg.program_id,
      childId: reg.child_id,
    },
    idempotencyKey: `clearance-notify-${share.id}`,
  });

  return { shareId: share.id };
}

export async function getStaffClearanceSummary(
  registrationId: string,
): Promise<StaffClearanceSummary | null> {
  const supabase = await createClient();
  const { data } = await clearanceSharesTable(supabase)
    .select("share_status, summary, conditions, expires_at, shared_at, revoked_at")
    .eq("registration_id", registrationId)
    .is("revoked_at", null)
    .order("shared_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Pick<
    ShareRow,
    "share_status" | "summary" | "conditions" | "expires_at" | "shared_at" | "revoked_at"
  >;

  const expired = isExpired(row.expires_at);
  if (expired) return null;

  return {
    shareStatus: row.share_status,
    summary: row.summary,
    conditions: row.conditions,
    expiresAt: row.expires_at,
    sharedAt: row.shared_at,
    isExpired: false,
  };
}
