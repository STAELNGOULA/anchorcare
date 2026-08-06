import type {
  HealthCheckStatus,
  MorningHealthCheck,
  SubmitHealthCheckInput,
  TodayMorningHealth,
} from "@/lib/health/health-check-types";
import { enqueueJob } from "@/lib/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function healthCheckTable(client: { from: (table: string) => any }): any {
  return client.from("morning_health_checks" as "organizations");
}

function todayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const VALID_STATUSES: HealthCheckStatus[] = [
  "healthy",
  "mild_symptoms",
  "staying_home",
];

async function assertParentOwnsChild(parentId: string, childId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();
  return Boolean(data);
}

async function activeRegistration(childId: string): Promise<{
  programId: string | null;
  orgId: string | null;
} | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("program_registrations")
    .select("program_id, org_id")
    .eq("child_id", childId)
    .in("status", ["active", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { programId: data.program_id, orgId: data.org_id };
}

export async function submitMorningHealthCheck(
  parentId: string,
  input: SubmitHealthCheckInput,
): Promise<MorningHealthCheck | { error: string }> {
  if (!VALID_STATUSES.includes(input.healthStatus)) {
    return { error: "invalid_status" };
  }

  if (!(await assertParentOwnsChild(parentId, input.childId))) {
    return { error: "forbidden" };
  }

  const reg = await activeRegistration(input.childId);
  if (!reg?.orgId) return { error: "no_program" };

  const service = createServiceClient();
  const checkDate = todayDateString();
  const note = input.note?.trim() ? input.note.trim().slice(0, 500) : null;

  const { data, error } = await healthCheckTable(service)
    .upsert(
      {
        child_id: input.childId,
        parent_id: parentId,
        org_id: reg.orgId,
        program_id: reg.programId,
        health_status: input.healthStatus,
        note,
        check_date: checkDate,
      },
      { onConflict: "child_id,check_date" },
    )
    .select("id, child_id, health_status, note, check_date, created_at")
    .single();

  if (error || !data) return { error: "save_failed" };

  await enqueueJob({
    type: "health_check_notify_staff",
    payload: {
      childId: input.childId,
      orgId: reg.orgId,
      programId: reg.programId,
      healthStatus: input.healthStatus,
      priority: input.healthStatus === "staying_home" ? "high" : "standard",
    },
    idempotencyKey: `health-check-notify-${input.childId}-${checkDate}`,
  });

  return {
    id: data.id,
    childId: data.child_id,
    healthStatus: data.health_status as HealthCheckStatus,
    note: data.note,
    checkDate: data.check_date,
    createdAt: data.created_at,
  };
}

export async function listTodayHealthChecksForChildren(
  childIds: string[],
): Promise<TodayMorningHealth[]> {
  if (childIds.length === 0) return [];

  const service = createServiceClient();
  const checkDate = todayDateString();

  const { data } = await healthCheckTable(service)
    .select("child_id, health_status, note")
    .in("child_id", childIds)
    .eq("check_date", checkDate);

  return (data ?? []).map((row: {
    child_id: string;
    health_status: HealthCheckStatus;
    note: string | null;
  }) => ({
    childId: row.child_id,
    healthStatus: row.health_status,
    note: row.note,
  }));
}
