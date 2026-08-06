import type { ChildMedication, EmergencyContact } from "@/lib/parent/child-types";
import { enqueueJob } from "@/lib/jobs/processor";
import { getChildForParent } from "@/lib/parent/children-service";
import { parseAllergyItems } from "@/lib/roster/allergy-utils";
import {
  canCoachAccessRegistration,
  getCoachOrgId,
} from "@/lib/roster/roster-service";
import { getDirectorOrgId } from "@/lib/registrations/registration-service";
import type {
  EmergencyConsents,
  ParentEmergencyChild,
  StaffEmergencyCard,
  StaffEmergencyNavItem,
} from "@/lib/emergency/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ConsentRow = {
  registration_id: string;
  child_id: string;
  program_id: string;
  share_allergies: boolean;
  share_meds: boolean;
  share_contacts: boolean;
  share_photos: boolean;
  updated_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function consentsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("emergency_program_consents" as "program_registrations");
}

async function fetchConsentsForRegistrations(
  registrationIds: string[],
): Promise<Map<string, ConsentRow>> {
  if (registrationIds.length === 0) return new Map();
  const service = createServiceClient();
  const { data } = await consentsTable(service)
    .select(
      "registration_id, child_id, program_id, share_allergies, share_meds, share_contacts, share_photos, updated_at",
    )
    .in("registration_id", registrationIds);

  return new Map(
    ((data ?? []) as ConsentRow[]).map((row) => [row.registration_id, row]),
  );
}

export async function listParentEmergencyChildren(
  parentId: string,
): Promise<ParentEmergencyChild[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("children")
    .select("id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (!rows?.length) return [];

  const profiles = await Promise.all(
    rows.map((row) => getChildForParent(parentId, row.id)),
  );

  const children = profiles.filter((c) => c !== null);
  const registrationIds = children.flatMap((c) =>
    c.programs.map((p) => p.id),
  );
  const consentMap = await fetchConsentsForRegistrations(registrationIds);

  return children.map((child) => ({
    childId: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    allergies: child.allergies,
    allergyItems: child.allergyItems,
    medicalConditions: child.medicalConditions,
    physicianName: child.physicianName,
    physicianPhone: child.physicianPhone,
    medications: child.medications,
    emergencyContacts: child.emergencyContacts,
    programs: child.programs
      .filter((p) => p.status === "active" || p.status === "pending")
      .map((p) => {
        const consent = consentMap.get(p.id);
        return {
          registrationId: p.id,
          programId: p.programId,
          programName: p.programName,
          orgName: p.orgName,
          status: p.status,
          sharePhotos: consent?.share_photos ?? true,
          shareAllergies: consent?.share_allergies ?? true,
          shareMeds: consent?.share_meds ?? true,
          shareContacts: consent?.share_contacts ?? true,
        };
      }),
  }));
}

export async function updateEmergencyConsents(
  parentId: string,
  registrationId: string,
  consents: Partial<EmergencyConsents>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("program_registrations")
    .select("id, parent_id")
    .eq("id", registrationId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!reg) return { ok: false, error: "not_found" };

  const patch: Record<string, boolean> = {};
  if (consents.sharePhotos !== undefined) {
    patch.share_photos = consents.sharePhotos;
  }
  if (consents.shareAllergies !== undefined) {
    patch.share_allergies = consents.shareAllergies;
  }
  if (consents.shareMeds !== undefined) {
    patch.share_meds = consents.shareMeds;
  }
  if (consents.shareContacts !== undefined) {
    patch.share_contacts = consents.shareContacts;
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const service = createServiceClient();
  const { error } = await consentsTable(service)
    .update(patch)
    .eq("registration_id", registrationId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, error: "save_failed" };

  const { data: regMeta } = await supabase
    .from("program_registrations")
    .select("program_id, org_id")
    .eq("id", registrationId)
    .maybeSingle();

  if (regMeta) {
    await enqueueJob({
      type: "consent_change_notify_program",
      payload: {
        registrationId,
        programId: regMeta.program_id,
        orgId: regMeta.org_id,
        parentId,
      },
      idempotencyKey: `consent-notify:${registrationId}:${Date.now()}`,
    });
  }

  return { ok: true };
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

function applyConsentsToCard(
  raw: {
    registrationId: string;
    childId: string;
    firstName: string;
    lastName: string;
    programName: string;
    allergies: string | null;
    allergyItems: unknown;
    medicalConditions: string | null;
    physicianName: string | null;
    physicianPhone: string | null;
    medications: ChildMedication[];
    emergencyContacts: EmergencyContact[];
    updatedAt: string;
  },
  consents: EmergencyConsents,
): StaffEmergencyCard {
  return {
    registrationId: raw.registrationId,
    childId: raw.childId,
    firstName: raw.firstName,
    lastName: raw.lastName,
    programName: raw.programName,
    consents,
    allergies: consents.shareAllergies ? raw.allergies : null,
    allergyItems: consents.shareAllergies
      ? parseAllergyItems(raw.allergyItems)
      : [],
    medicalConditions: consents.shareAllergies ? raw.medicalConditions : null,
    medications: consents.shareMeds ? raw.medications : [],
    emergencyContacts: consents.shareContacts ? raw.emergencyContacts : [],
    physicianName: consents.shareContacts ? raw.physicianName : null,
    physicianPhone: consents.shareContacts ? raw.physicianPhone : null,
    updatedAt: raw.updatedAt,
    withheld: {
      allergies: !consents.shareAllergies,
      meds: !consents.shareMeds,
      contacts: !consents.shareContacts,
    },
  };
}

export async function getStaffEmergencyCard(
  registrationId: string,
  scope:
    | { type: "org"; orgId: string }
    | { type: "coach"; userId: string; orgId: string },
): Promise<StaffEmergencyCard | null> {
  const service = createServiceClient();

  let regQuery = service
    .from("program_registrations")
    .select("id, child_id, program_id, org_id, parent_id, status")
    .eq("id", registrationId)
    .in("status", ["active", "pending"]);

  if (scope.type === "org") {
    regQuery = regQuery.eq("org_id", scope.orgId);
  } else {
    const allowed = await canCoachAccessRegistration(
      scope.userId,
      registrationId,
    );
    if (!allowed) return null;
    regQuery = regQuery.eq("org_id", scope.orgId);
  }

  const { data: reg } = await regQuery.maybeSingle();
  if (!reg) return null;

  const [{ data: child }, consentMap, medications, emergencyContacts, { data: programRow }] =
    await Promise.all([
      service
        .from("children")
        .select(
          "id, first_name, last_name, allergies, allergy_items, medical_conditions, physician_name, physician_phone",
        )
        .eq("id", reg.child_id)
        .maybeSingle(),
      fetchConsentsForRegistrations([registrationId]),
      fetchMedications(reg.child_id),
      fetchEmergencyContacts(reg.child_id),
      service.from("programs").select("name").eq("id", reg.program_id).maybeSingle(),
    ]);

  if (!child) return null;

  const consentRow = consentMap.get(registrationId);
  const consents: EmergencyConsents = {
    sharePhotos: consentRow?.share_photos ?? true,
    shareAllergies: consentRow?.share_allergies ?? true,
    shareMeds: consentRow?.share_meds ?? true,
    shareContacts: consentRow?.share_contacts ?? true,
  };

  return applyConsentsToCard(
    {
      registrationId,
      childId: child.id,
      firstName: child.first_name,
      lastName: child.last_name,
      programName: programRow?.name ?? "Program",
      allergies: child.allergies,
      allergyItems: child.allergy_items,
      medicalConditions: child.medical_conditions,
      physicianName: child.physician_name,
      physicianPhone: child.physician_phone,
      medications,
      emergencyContacts,
      updatedAt: consentRow?.updated_at ?? new Date().toISOString(),
    },
    consents,
  );
}

export async function resolveStaffEmergencyScope(
  userId: string,
  role: string,
): Promise<
  | { type: "org"; orgId: string }
  | { type: "coach"; userId: string; orgId: string }
  | null
> {
  if (role === "business_admin") {
    const orgId = await getDirectorOrgId(userId);
    return orgId ? { type: "org", orgId } : null;
  }
  if (role === "coach") {
    const orgId = await getCoachOrgId(userId);
    return orgId ? { type: "coach", userId, orgId } : null;
  }
  return null;
}

export async function getParentEmergencyChild(
  parentId: string,
  childId: string,
): Promise<ParentEmergencyChild | null> {
  const child = await getChildForParent(parentId, childId);
  if (!child) return null;

  const registrationIds = child.programs
    .filter((p) => p.status === "active" || p.status === "pending")
    .map((p) => p.id);
  const consentMap = await fetchConsentsForRegistrations(registrationIds);

  return {
    childId: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    allergies: child.allergies,
    allergyItems: child.allergyItems,
    medicalConditions: child.medicalConditions,
    physicianName: child.physicianName,
    physicianPhone: child.physicianPhone,
    medications: child.medications,
    emergencyContacts: child.emergencyContacts,
    programs: child.programs
      .filter((p) => p.status === "active" || p.status === "pending")
      .map((p) => {
        const consent = consentMap.get(p.id);
        return {
          registrationId: p.id,
          programId: p.programId,
          programName: p.programName,
          orgName: p.orgName,
          status: p.status,
          sharePhotos: consent?.share_photos ?? true,
          shareAllergies: consent?.share_allergies ?? true,
          shareMeds: consent?.share_meds ?? true,
          shareContacts: consent?.share_contacts ?? true,
        };
      }),
  };
}
