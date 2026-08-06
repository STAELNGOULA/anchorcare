import { buildBookingUrl } from "@/lib/doctors/booking-url";
import type {
  CreateDoctorInput,
  DoctorAuditEntry,
  DoctorListItem,
  DoctorRecord,
  IncidentBookingPrefill,
  UpdateDoctorInput,
} from "@/lib/doctors/doctor-types";
import { doctorAuditLogTable, doctorsTable } from "@/lib/doctors/table-utils";
import type { CountryCode } from "@/lib/geo/regions";
import { recordParentEngagement } from "@/lib/parent/today-service";
import { incidentsTable } from "@/lib/reports/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

type DoctorRow = {
  id: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  specialty: string;
  languages: string[];
  country: string;
  region: string | null;
  booking_url: string;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapDoctor(row: DoctorRow): DoctorRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    bio: row.bio,
    specialty: row.specialty as DoctorRecord["specialty"],
    languages: row.languages ?? [],
    country: row.country as CountryCode,
    region: row.region,
    bookingUrl: row.booking_url,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapListItem(row: DoctorRow): DoctorListItem {
  const doctor = mapDoctor(row);
  return {
    id: doctor.id,
    displayName: doctor.displayName,
    photoUrl: doctor.photoUrl,
    specialty: doctor.specialty,
    languages: doctor.languages,
    country: doctor.country,
    region: doctor.region,
    isFeatured: doctor.isFeatured,
    bio: doctor.bio,
  };
}

function snapshot(doctor: DoctorRecord): Record<string, unknown> {
  return {
    displayName: doctor.displayName,
    photoUrl: doctor.photoUrl,
    bio: doctor.bio,
    specialty: doctor.specialty,
    languages: doctor.languages,
    country: doctor.country,
    region: doctor.region,
    bookingUrl: doctor.bookingUrl,
    isFeatured: doctor.isFeatured,
    sortOrder: doctor.sortOrder,
    isActive: doctor.isActive,
  };
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

export function doctorMatchesParentRegion(
  doctor: Pick<DoctorRecord, "country" | "region">,
  parentCountry: CountryCode | null,
  parentRegion: string | null,
): boolean {
  if (!parentCountry) return true;
  if (doctor.country !== parentCountry) return false;
  if (!doctor.region) return true;
  if (!parentRegion) return true;
  return doctor.region === parentRegion;
}

export async function getParentGeo(
  parentId: string,
): Promise<{ country: CountryCode | null; region: string | null }> {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("country, region")
    .eq("id", parentId)
    .maybeSingle();

  const country =
    data?.country === "US" || data?.country === "CA" ? data.country : null;
  const region =
    typeof data?.region === "string" && data.region.trim()
      ? data.region.trim()
      : null;

  return { country, region };
}

export async function getIncidentBookingPrefill(
  parentId: string,
  incidentId: string,
  childId: string,
): Promise<IncidentBookingPrefill | null> {
  const service = createServiceClient();
  const { data: incident } = await incidentsTable(service)
    .select(
      "id, child_id, incident_type, occurred_at, mechanism, body_area, symptoms, children(first_name, last_name, parent_id)",
    )
    .eq("id", incidentId)
    .maybeSingle();

  if (!incident) return null;

  const row = incident as {
    id: string;
    child_id: string;
    incident_type: string;
    occurred_at: string;
    mechanism: string | null;
    body_area: string | null;
    symptoms: string | null;
    children: {
      first_name: string;
      last_name: string;
      parent_id: string;
    } | null;
  };

  const child = row.children;
  if (!child || child.parent_id !== parentId || row.child_id !== childId) {
    return null;
  }

  const parts = [row.mechanism, row.body_area, row.symptoms].filter(Boolean);

  return {
    incidentId,
    childId,
    childName: `${child.first_name} ${child.last_name}`.trim(),
    incidentType: String(row.incident_type),
    occurredAt: String(row.occurred_at),
    summary: parts.join(" · ") || "Program incident",
  };
}

export function formatIncidentBookingNotes(
  prefill: IncidentBookingPrefill,
): string {
  const date = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(prefill.occurredAt));

  return [
    "ANCHOR Care referral",
    `Child: ${prefill.childName}`,
    `Incident: ${prefill.incidentType.replace(/_/g, " ")} (${date})`,
    prefill.summary,
  ].join(" — ");
}

export async function listDoctorsForParent(
  parentId: string,
  options?: { specialty?: string; search?: string },
): Promise<{
  doctors: DoctorListItem[];
  parentCountry: CountryCode | null;
  parentRegion: string | null;
  regionEmpty: boolean;
}> {
  const service = createServiceClient();
  const { country: parentCountry, region: parentRegion } =
    await getParentGeo(parentId);

  const { data } = await doctorsTable(service)
    .select(
      "id, display_name, photo_url, bio, specialty, languages, country, region, is_featured, sort_order, booking_url, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("display_name", { ascending: true });

  let rows = (data ?? []) as DoctorRow[];

  if (parentCountry) {
    rows = rows.filter((row) =>
      doctorMatchesParentRegion(
        { country: row.country as CountryCode, region: row.region },
        parentCountry,
        parentRegion,
      ),
    );
  }

  if (options?.specialty) {
    rows = rows.filter((row) => row.specialty === options.specialty);
  }

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        row.display_name.toLowerCase().includes(q) ||
        row.bio?.toLowerCase().includes(q),
    );
  }

  const regionEmpty = parentCountry != null && rows.length === 0;

  return {
    doctors: rows.map(mapListItem),
    parentCountry,
    parentRegion,
    regionEmpty,
  };
}

export async function getDoctorForParent(
  doctorId: string,
  parentId: string,
): Promise<DoctorRecord | { error: "not_found" | "region_unavailable" }> {
  const service = createServiceClient();
  const { data } = await doctorsTable(service)
    .select("*")
    .eq("id", doctorId)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { error: "not_found" };

  const doctor = mapDoctor(data as DoctorRow);
  const { country, region } = await getParentGeo(parentId);

  if (
    country &&
    !doctorMatchesParentRegion(doctor, country, region)
  ) {
    return { error: "region_unavailable" };
  }

  return doctor;
}

export async function listDoctorsForAdmin(options?: {
  search?: string;
  includeInactive?: boolean;
}): Promise<DoctorRecord[]> {
  const service = createServiceClient();
  let query = doctorsTable(service)
    .select("*")
    .order("sort_order", { ascending: false })
    .order("display_name", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data } = await query;
  let rows = (data ?? []) as DoctorRow[];

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        row.display_name.toLowerCase().includes(q) ||
        row.specialty.toLowerCase().includes(q),
    );
  }

  return rows.map(mapDoctor);
}

export async function getDoctorForAdmin(
  doctorId: string,
): Promise<DoctorRecord | null> {
  const service = createServiceClient();
  const { data } = await doctorsTable(service)
    .select("*")
    .eq("id", doctorId)
    .maybeSingle();

  if (!data) return null;
  return mapDoctor(data as DoctorRow);
}

async function writeDoctorAudit(
  adminId: string,
  doctorId: string | null,
  action: DoctorAuditEntry["action"],
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown>,
): Promise<void> {
  const service = createServiceClient();
  await doctorAuditLogTable(service).insert({
    doctor_id: doctorId,
    admin_id: adminId,
    action,
    before_state: beforeState,
    after_state: afterState,
  });
}

export async function createDoctor(
  adminId: string,
  input: CreateDoctorInput,
): Promise<{ ok: true; doctor: DoctorRecord } | { ok: false; error: string }> {
  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await doctorsTable(service)
    .insert({
      display_name: input.displayName,
      photo_url: input.photoUrl ?? null,
      bio: input.bio ?? null,
      specialty: input.specialty,
      languages: input.languages,
      country: input.country,
      region: input.region ?? null,
      booking_url: input.bookingUrl,
      is_featured: input.isFeatured ?? false,
      sort_order: input.sortOrder ?? 0,
      is_active: true,
      created_by: adminId,
      updated_by: adminId,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "create_failed" };
  }

  const doctor = mapDoctor(data as DoctorRow);
  await writeDoctorAudit(adminId, doctor.id, "create", null, snapshot(doctor));
  return { ok: true, doctor };
}

export async function updateDoctor(
  adminId: string,
  doctorId: string,
  input: UpdateDoctorInput,
): Promise<{ ok: true; doctor: DoctorRecord } | { ok: false; error: string }> {
  const existing = await getDoctorForAdmin(doctorId);
  if (!existing) return { ok: false, error: "not_found" };

  const before = snapshot(existing);
  const patch: Record<string, unknown> = {
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.specialty !== undefined) patch.specialty = input.specialty;
  if (input.languages !== undefined) patch.languages = input.languages;
  if (input.country !== undefined) patch.country = input.country;
  if (input.region !== undefined) patch.region = input.region;
  if (input.bookingUrl !== undefined) patch.booking_url = input.bookingUrl;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const service = createServiceClient();
  const { data, error } = await doctorsTable(service)
    .update(patch)
    .eq("id", doctorId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "update_failed" };
  }

  const doctor = mapDoctor(data as DoctorRow);
  const action =
    input.isActive === false && existing.isActive
      ? "deactivate"
      : input.isActive === true && !existing.isActive
        ? "reactivate"
        : "update";

  await writeDoctorAudit(adminId, doctorId, action, before, snapshot(doctor));
  return { ok: true, doctor };
}

export async function listDoctorAudit(
  doctorId: string,
): Promise<DoctorAuditEntry[]> {
  const service = createServiceClient();
  const { data } = await doctorAuditLogTable(service)
    .select("id, doctor_id, admin_id, action, before_state, after_state, created_at")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row: {
    id: string;
    doctor_id: string | null;
    admin_id: string;
    action: DoctorAuditEntry["action"];
    before_state: Record<string, unknown> | null;
    after_state: Record<string, unknown>;
    created_at: string;
  }) => ({
    id: row.id,
    doctorId: row.doctor_id,
    adminId: row.admin_id,
    action: row.action,
    beforeState: row.before_state,
    afterState: row.after_state,
    createdAt: row.created_at,
  }));
}

export async function recordDoctorBookingClick(
  parentId: string,
  doctorId: string,
  options?: {
    childId?: string;
    incidentId?: string;
    notes?: string;
  },
): Promise<{ ok: true; bookingUrl: string } | { ok: false; error: string }> {
  const doctorResult = await getDoctorForParent(doctorId, parentId);
  if ("error" in doctorResult) {
    return { ok: false, error: doctorResult.error };
  }

  const bookingUrl = buildBookingUrl(doctorResult.bookingUrl, options?.notes);

  await recordParentEngagement(parentId, "booking_click", {
    childId: options?.childId,
    metadata: {
      doctorId,
      incidentId: options?.incidentId ?? null,
      source: "doctor_detail",
    },
  });

  return { ok: true, bookingUrl };
}
