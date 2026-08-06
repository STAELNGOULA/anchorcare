import type { PickupEtaSummary, SetPickupEtaInput } from "@/lib/pickups/pickup-eta-types";
import { enqueueJob } from "@/lib/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";

type EtaRow = {
  id: string;
  child_id: string;
  minutes_late: number;
  note: string | null;
  expected_at: string;
  program_id: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickupEtaTable(client: { from: (table: string) => any }): any {
  return client.from("pickup_eta_events" as "profiles");
}

function localDateString(timezone = "UTC"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function assertParentOwnsChild(
  parentId: string,
  childId: string,
): Promise<boolean> {
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
  programName: string | null;
} | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("program_registrations")
    .select("program_id, org_id, programs(name)")
    .eq("child_id", childId)
    .in("status", ["active", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const programs = data.programs as { name?: string } | null;
  return {
    programId: data.program_id,
    orgId: data.org_id,
    programName: programs?.name ?? null,
  };
}

function mapEta(row: EtaRow, programName: string | null): PickupEtaSummary {
  return {
    id: row.id,
    childId: row.child_id,
    minutesLate: row.minutes_late,
    note: row.note,
    expectedAt: row.expected_at,
    programId: row.program_id,
    programName,
  };
}

export async function setPickupEta(
  parentId: string,
  input: SetPickupEtaInput,
): Promise<
  | { ok: true; eta: PickupEtaSummary }
  | { ok: false; error: "notFound" | "noEnrollment" | "invalidMinutes" }
> {
  if (input.minutesLate < 1 || input.minutesLate > 240) {
    return { ok: false, error: "invalidMinutes" };
  }

  const ownsChild = await assertParentOwnsChild(parentId, input.childId);
  if (!ownsChild) return { ok: false, error: "notFound" };

  const reg = await activeRegistration(input.childId);
  if (!reg?.orgId) return { ok: false, error: "noEnrollment" };

  const service = createServiceClient();
  const table = pickupEtaTable(service);
  const now = new Date();
  const expectedAt = new Date(now.getTime() + input.minutesLate * 60_000);
  const validDate = localDateString();

  await table
    .update({ canceled_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("child_id", input.childId)
    .is("canceled_at", null)
    .eq("valid_date", validDate);

  const { data: inserted, error } = await table
    .insert({
      child_id: input.childId,
      parent_id: parentId,
      program_id: reg.programId,
      org_id: reg.orgId,
      minutes_late: input.minutesLate,
      note: input.note?.trim() || null,
      expected_at: expectedAt.toISOString(),
      valid_date: validDate,
    })
    .select("id, child_id, minutes_late, note, expected_at, program_id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "notFound" };
  }

  const eta = mapEta(inserted as EtaRow, reg.programName);

  await enqueueJob({
    type: "pickup_eta_notify_business",
    idempotencyKey: `pickup_eta_notify:${eta.id}`,
    payload: {
      etaId: eta.id,
      childId: eta.childId,
      orgId: reg.orgId,
      programId: reg.programId,
      expectedAt: eta.expectedAt,
      minutesLate: eta.minutesLate,
    },
  });

  return { ok: true, eta };
}

export async function clearPickupEta(
  parentId: string,
  childId: string,
): Promise<{ ok: true } | { ok: false; error: "notFound" }> {
  const ownsChild = await assertParentOwnsChild(parentId, childId);
  if (!ownsChild) return { ok: false, error: "notFound" };

  const service = createServiceClient();
  const now = new Date().toISOString();
  await pickupEtaTable(service)
    .update({ canceled_at: now, updated_at: now })
    .eq("child_id", childId)
    .eq("parent_id", parentId)
    .is("canceled_at", null);

  return { ok: true };
}

export async function listActivePickupEtas(
  parentId: string,
  childIds: string[],
): Promise<Map<string, PickupEtaSummary>> {
  const result = new Map<string, PickupEtaSummary>();
  if (childIds.length === 0) return result;

  const service = createServiceClient();
  const now = new Date().toISOString();
  const { data: rows } = await pickupEtaTable(service)
    .select("id, child_id, minutes_late, note, expected_at, program_id, programs(name)")
    .eq("parent_id", parentId)
    .in("child_id", childIds)
    .is("canceled_at", null)
    .gt("expected_at", now)
    .eq("valid_date", localDateString());

  for (const row of (rows ?? []) as (EtaRow & { programs?: { name?: string } | null })[]) {
    result.set(
      row.child_id,
      mapEta(row, row.programs?.name ?? null),
    );
  }

  return result;
}
