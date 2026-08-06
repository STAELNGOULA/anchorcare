import type { ChildMedication, EmergencyContact } from "@/lib/parent/child-types";
import { parseAllergyItems } from "@/lib/roster/allergy-utils";
import { pickupEtaFromRosterRow } from "@/lib/pickups/pickup-eta-roster";
import { morningHealthFromRosterRow } from "@/lib/health/health-check-roster";
import type {
  ClearanceStatus,
  RosterChildDetail,
  RosterFilters,
  RosterListItem,
  RosterListResult,
} from "@/lib/roster/types";
import { ROSTER_PAGE_SIZE } from "@/lib/roster/constants";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PAGE_SIZE = ROSTER_PAGE_SIZE;
const PHOTO_BUCKET = "child-photos";
const SIGNED_URL_TTL = 3600;

// roster_entries is a DB view — not yet in generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rosterTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("roster_entries" as "program_registrations");
}

type RosterRow = {
  registration_id: string;
  org_id: string;
  program_id: string;
  child_id: string;
  parent_id: string;
  registration_status: "pending" | "active" | "withdrawn";
  enrolled_at: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  photo_url: string | null;
  allergies: string | null;
  allergy_items: unknown;
  medical_conditions: string | null;
  medications: unknown;
  physician_name: string | null;
  physician_phone: string | null;
  insurance_info: string | null;
  program_name: string;
  program_slug: string;
  group_name: string | null;
  staff_notes: string | null;
  clearance_override: ClearanceStatus | null;
  clearance_status: ClearanceStatus;
  pickup_override_today: boolean;
  pickup_override_name: string | null;
  pickup_override_note: string | null;
  pickup_override_until: string | null;
  pickup_override_expires_at: string | null;
  pickup_eta_active: boolean;
  pickup_eta_minutes: number | null;
  pickup_eta_note: string | null;
  pickup_eta_expected_at: string | null;
  morning_health_status: string | null;
  morning_health_note: string | null;
};

async function signedPhotoUrl(
  parentId: string,
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) return null;
  try {
    const service = createServiceClient();
    const { data, error } = await service.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(photoPath, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

function mapRowToListItem(
  row: RosterRow,
  photoSignedUrl: string | null,
): RosterListItem {
  return {
    registrationId: row.registration_id,
    orgId: row.org_id,
    programId: row.program_id,
    programName: row.program_name,
    childId: row.child_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    photoSignedUrl,
    allergies: row.allergies,
    allergyItems: parseAllergyItems(row.allergy_items),
    medicalConditions: row.medical_conditions,
    registrationStatus: row.registration_status,
    clearanceStatus: row.clearance_status,
    pickupOverrideToday: row.pickup_override_today,
    pickupOverride: row.pickup_override_today
      ? {
          active: true,
          personName: row.pickup_override_name,
          note: row.pickup_override_note,
          untilTime: row.pickup_override_until,
          expiresAt: row.pickup_override_expires_at,
        }
      : null,
    pickupEta: pickupEtaFromRosterRow(row),
    morningHealth: morningHealthFromRosterRow(row),
    groupName: row.group_name,
    enrolledAt: row.enrolled_at,
  };
}

async function fetchCoachProgramIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.program_id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyRosterFilters(query: any, filters: RosterFilters) {
  let q = query;
  if (filters.programId) {
    q = q.eq("program_id", filters.programId);
  }
  if (filters.clearance && filters.clearance !== "all") {
    q = q.eq("clearance_status", filters.clearance);
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    q = q.or(`first_name.ilike.${term},last_name.ilike.${term}`);
  }
  return q;
}

async function listProgramsForScope(
  orgId: string,
  programIds?: string[],
): Promise<{ id: string; name: string }[]> {
  const service = createServiceClient();
  let query = service
    .from("programs")
    .select("id, name")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("name");

  if (programIds) {
    if (programIds.length === 0) return [];
    query = query.in("id", programIds);
  }

  const { data } = await query;
  return (data ?? []).map((p) => ({ id: p.id, name: p.name }));
}

export async function listRosterForOrg(
  orgId: string,
  filters: RosterFilters = {},
): Promise<RosterListResult> {
  const service = createServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = rosterTable(service)
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  query = applyRosterFilters(query, filters);

  const [{ data: rows, count }, programs] = await Promise.all([
    query,
    listProgramsForScope(orgId),
  ]);

  const rosterRows = (rows ?? []) as RosterRow[];
  const parentPhotoPairs = rosterRows.map((r) => ({
    parentId: r.parent_id,
    photoPath: r.photo_url,
  }));

  const photoUrls = await Promise.all(
    parentPhotoPairs.map((p) => signedPhotoUrl(p.parentId, p.photoPath)),
  );

  const items = rosterRows.map((row, i) =>
    mapRowToListItem(row, photoUrls[i] ?? null),
  );

  return { items, total: count ?? 0, programs };
}

export async function listRosterForCoach(
  userId: string,
  orgId: string,
  filters: RosterFilters = {},
): Promise<RosterListResult> {
  const programIds = await fetchCoachProgramIds(userId);
  if (programIds.length === 0) {
    return { items: [], total: 0, programs: [] };
  }

  const service = createServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = rosterTable(service)
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .in("program_id", programIds)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  query = applyRosterFilters(query, filters);

  const [{ data: rows, count }, programs] = await Promise.all([
    query,
    listProgramsForScope(orgId, programIds),
  ]);

  const rosterRows = (rows ?? []) as RosterRow[];
  const photoUrls = await Promise.all(
    rosterRows.map((r) => signedPhotoUrl(r.parent_id, r.photo_url)),
  );

  const items = rosterRows.map((row, i) =>
    mapRowToListItem(row, photoUrls[i] ?? null),
  );

  return { items, total: count ?? 0, programs };
}

async function fetchMedications(childId: string): Promise<ChildMedication[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("child_medications")
    .select("id, name, dose, schedule")
    .eq("child_id", childId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    dose: row.dose ?? "",
    schedule: row.schedule ?? "",
  }));
}

async function fetchEmergencyContacts(
  childId: string,
): Promise<EmergencyContact[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("child_emergency_contacts")
    .select("id, name, phone, relation")
    .eq("child_id", childId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    relation: row.relation,
  }));
}

export async function getCoachOrgId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.org_id) return null;
  if (profile.role !== "coach" && profile.role !== "business_admin") return null;
  return profile.org_id;
}

export async function canCoachAccessRegistration(
  userId: string,
  registrationId: string,
): Promise<boolean> {
  const programIds = await fetchCoachProgramIds(userId);
  if (programIds.length === 0) return false;

  const service = createServiceClient();
  const { data } = await rosterTable(service)
    .select("program_id")
    .eq("registration_id", registrationId)
    .maybeSingle();

  const row = data as { program_id: string } | null;
  if (!row) return false;
  return programIds.includes(row.program_id);
}

export async function getRosterChildDetail(
  registrationId: string,
  scope: { type: "org"; orgId: string } | { type: "coach"; userId: string; orgId: string },
): Promise<RosterChildDetail | null> {
  const service = createServiceClient();

  let query = rosterTable(service)
    .select("*")
    .eq("registration_id", registrationId);

  if (scope.type === "org") {
    query = query.eq("org_id", scope.orgId);
  } else {
    const programIds = await fetchCoachProgramIds(scope.userId);
    if (programIds.length === 0) return null;
    query = query.eq("org_id", scope.orgId).in("program_id", programIds);
  }

  const { data: row } = await query.maybeSingle();
  if (!row) return null;

  const rosterRow = row as RosterRow;
  const [photoSignedUrl, medications, emergencyContacts, { data: parentProfile }] =
    await Promise.all([
      signedPhotoUrl(rosterRow.parent_id, rosterRow.photo_url),
      fetchMedications(rosterRow.child_id),
      fetchEmergencyContacts(rosterRow.child_id),
      service
        .from("profiles")
        .select("email")
        .eq("id", rosterRow.parent_id)
        .maybeSingle(),
    ]);

  const base = mapRowToListItem(rosterRow, photoSignedUrl);

  return {
    ...base,
    parentId: rosterRow.parent_id,
    parentEmail: (parentProfile as { email?: string } | null)?.email ?? null,
    staffNotes: rosterRow.staff_notes,
    medications,
    emergencyContacts,
    physicianName: rosterRow.physician_name,
    physicianPhone: rosterRow.physician_phone,
    insuranceInfo: rosterRow.insurance_info,
  };
}

export { ROSTER_PAGE_SIZE } from "@/lib/roster/constants";
