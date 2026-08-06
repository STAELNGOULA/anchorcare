import type {
  AllergyItem,
  ChildListItem,
  ChildMedication,
  ChildProfile,
  EmergencyContact,
} from "@/lib/parent/child-types";
import { getParentEntitlements } from "@/lib/billing/entitlements";
import { computeHealthScore } from "@/lib/parent/child-health-score";
import type { ChildCreateInput, ChildUpdateInput } from "@/lib/parent/child-validation";
import type { Database } from "@/types/supabase";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ChildrenUpdate = Database["public"]["Tables"]["children"]["Update"];

const PHOTO_BUCKET = "child-photos";
const SIGNED_URL_TTL = 3600;

function parseAllergyItems(raw: unknown): AllergyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is { name: string; severity: string } => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { name?: string }).name === "string"
      );
    })
    .map((item) => ({
      name: item.name,
      severity:
        item.severity === "severe" || item.severity === "moderate"
          ? item.severity
          : "mild",
    }));
}

function medicationsToJsonb(meds: ChildMedication[]) {
  return meds.map((m) => ({
    name: m.name,
    dose: m.dose,
    schedule: m.schedule,
  }));
}

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

async function fetchMedications(
  childId: string,
): Promise<ChildMedication[]> {
  const supabase = await createClient();
  const { data } = await supabase
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
  const supabase = await createClient();
  const { data } = await supabase
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

async function fetchPrograms(childId: string, parentId: string) {
  const supabase = await createClient();
  const { data: registrations } = await supabase
    .from("program_registrations")
    .select("id, status, program_id, org_id")
    .eq("child_id", childId)
    .eq("parent_id", parentId);

  if (!registrations?.length) return [];

  const programIds = [...new Set(registrations.map((r) => r.program_id))];
  const orgIds = [...new Set(registrations.map((r) => r.org_id))];

  const [{ data: programs }, { data: orgs }] = await Promise.all([
    supabase.from("programs").select("id, name").in("id", programIds),
    supabase.from("organizations").select("id, name").in("id", orgIds),
  ]);

  const programMap = new Map((programs ?? []).map((p) => [p.id, p.name]));
  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  return registrations.map((row) => ({
    id: row.id,
    programId: row.program_id,
    programName: programMap.get(row.program_id) ?? "Program",
    status: row.status as "pending" | "active" | "withdrawn",
    orgName: orgMap.get(row.org_id) ?? "",
  }));
}

async function mapChildRow(
  row: {
    id: string;
    parent_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    photo_url: string | null;
    allergies: string | null;
    allergy_items: unknown;
    medical_conditions: string | null;
    physician_name: string | null;
    physician_phone: string | null;
    insurance_info: string | null;
    created_at: string;
    updated_at: string;
  },
  parentId: string,
): Promise<ChildProfile> {
  const [medications, emergencyContacts, programs, photoSignedUrl] =
    await Promise.all([
      fetchMedications(row.id),
      fetchEmergencyContacts(row.id),
      fetchPrograms(row.id, parentId),
      signedPhotoUrl(parentId, row.photo_url),
    ]);

  const allergyItems = parseAllergyItems(row.allergy_items);

  const healthScore = computeHealthScore({
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    allergyItems,
    allergies: row.allergies,
    medications,
    medicalConditions: row.medical_conditions,
    emergencyContacts,
    physicianName: row.physician_name,
    physicianPhone: row.physician_phone,
    photoUrl: row.photo_url,
  });

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    photoUrl: row.photo_url,
    photoSignedUrl,
    allergies: row.allergies,
    allergyItems,
    medicalConditions: row.medical_conditions,
    physicianName: row.physician_name,
    physicianPhone: row.physician_phone,
    insuranceInfo: row.insurance_info,
    medications,
    emergencyContacts,
    programCount: programs.length,
    programs,
    healthScore,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChildrenForParent(
  parentId: string,
): Promise<ChildListItem[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("children")
    .select(
      "id, parent_id, first_name, last_name, date_of_birth, photo_url, allergies, allergy_items, medical_conditions, physician_name, physician_phone, medications, created_at, updated_at",
    )
    .order("created_at", { ascending: true });

  if (!rows?.length) return [];

  const items: ChildListItem[] = [];
  for (const row of rows) {
    const [medications, emergencyContacts, programs, photoSignedUrl] =
      await Promise.all([
        fetchMedications(row.id),
        fetchEmergencyContacts(row.id),
        fetchPrograms(row.id, row.parent_id),
        signedPhotoUrl(row.parent_id, row.photo_url),
      ]);

    const allergyItems = parseAllergyItems(row.allergy_items);
    const healthScore = computeHealthScore({
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      allergyItems,
      allergies: row.allergies,
      medications,
      medicalConditions: row.medical_conditions,
      emergencyContacts,
      physicianName: row.physician_name,
      physicianPhone: row.physician_phone,
      photoUrl: row.photo_url,
    });

    items.push({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      photoSignedUrl,
      programCount: programs.length,
      healthScore,
    });
  }

  return items;
}

export async function getChildForParent(
  parentId: string,
  childId: string,
): Promise<ChildProfile | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("children")
    .select(
      "id, parent_id, first_name, last_name, date_of_birth, photo_url, allergies, allergy_items, medical_conditions, physician_name, physician_phone, insurance_info, created_at, updated_at",
    )
    .eq("id", childId)
    .maybeSingle();

  if (!row) return null;

  const isOwner = row.parent_id === parentId;
  if (!isOwner) {
    const { isGuardianForChild } = await import("@/lib/coparent/guardian-access");
    const isGuardian = await isGuardianForChild(parentId, childId);
    if (!isGuardian) return null;
  }

  return mapChildRow(row, row.parent_id);
}

async function syncMedications(
  parentId: string,
  childId: string,
  medications: ChildMedication[],
) {
  const supabase = await createClient();
  await supabase.from("child_medications").delete().eq("child_id", childId);

  if (medications.length === 0) return;

  await supabase.from("child_medications").insert(
    medications.map((med, index) => ({
      child_id: childId,
      parent_id: parentId,
      name: med.name,
      dose: med.dose ?? "",
      schedule: med.schedule ?? "",
      sort_order: index,
    })),
  );
}

async function syncEmergencyContacts(
  parentId: string,
  childId: string,
  contacts: EmergencyContact[],
) {
  const supabase = await createClient();
  await supabase
    .from("child_emergency_contacts")
    .delete()
    .eq("child_id", childId);

  if (contacts.length === 0) return;

  await supabase.from("child_emergency_contacts").insert(
    contacts.map((contact, index) => ({
      child_id: childId,
      parent_id: parentId,
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
      sort_order: index,
    })),
  );
}

async function loadCopySource(
  parentId: string,
  copyFromChildId: string,
): Promise<Partial<ChildCreateInput> | null> {
  const source = await getChildForParent(parentId, copyFromChildId);
  if (!source) return null;
  return {
    allergies: source.allergies,
    allergyItems: source.allergyItems,
    medicalConditions: source.medicalConditions,
    medications: source.medications,
    physicianName: source.physicianName,
    physicianPhone: source.physicianPhone,
    insuranceInfo: source.insuranceInfo,
    emergencyContacts: source.emergencyContacts,
  };
}

export async function createChildForParent(
  parentId: string,
  input: ChildCreateInput,
): Promise<
  | { ok: true; child: ChildProfile }
  | { ok: false; code: string; fieldErrors?: Record<string, string[]> }
> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  const entitlements = await getParentEntitlements(parentId, count ?? 0);
  if (!entitlements.canAddChild) {
    return { ok: false, code: "family_plan_required" };
  }

  let payload = { ...input };

  if (input.copyFromChildId) {
    const copied = await loadCopySource(parentId, input.copyFromChildId);
    if (copied) {
      payload = {
        ...payload,
        allergies: payload.allergies ?? copied.allergies ?? null,
        allergyItems:
          payload.allergyItems?.length
            ? payload.allergyItems
            : (copied.allergyItems ?? []),
        medicalConditions:
          payload.medicalConditions ?? copied.medicalConditions ?? null,
        medications:
          payload.medications?.length
            ? payload.medications
            : (copied.medications ?? []),
        physicianName: payload.physicianName ?? copied.physicianName ?? null,
        physicianPhone: payload.physicianPhone ?? copied.physicianPhone ?? null,
        insuranceInfo: payload.insuranceInfo ?? copied.insuranceInfo ?? null,
        emergencyContacts:
          payload.emergencyContacts?.length
            ? payload.emergencyContacts
            : (copied.emergencyContacts ?? []),
      };
    }
  }

  const { data: row, error } = await supabase
    .from("children")
    .insert({
      parent_id: parentId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      date_of_birth: payload.dateOfBirth,
      allergies: payload.allergies ?? null,
      allergy_items: payload.allergyItems ?? [],
      medical_conditions: payload.medicalConditions ?? null,
      physician_name: payload.physicianName ?? null,
      physician_phone: payload.physicianPhone || null,
      insurance_info: payload.insuranceInfo ?? null,
      medications: medicationsToJsonb(payload.medications ?? []),
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, code: "createFailed" };
  }

  await Promise.all([
    syncMedications(parentId, row.id, payload.medications ?? []),
    syncEmergencyContacts(parentId, row.id, payload.emergencyContacts ?? []),
  ]);

  const child = await getChildForParent(parentId, row.id);
  if (!child) return { ok: false, code: "createFailed" };
  return { ok: true, child };
}

export async function updateChildForParent(
  parentId: string,
  childId: string,
  input: ChildUpdateInput,
): Promise<
  | { ok: true; child: ChildProfile }
  | { ok: false; code: string }
> {
  const existing = await getChildForParent(parentId, childId);
  if (!existing) return { ok: false, code: "notFound" };

  const patch: ChildrenUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth;
  if (input.allergies !== undefined) patch.allergies = input.allergies;
  if (input.allergyItems !== undefined) patch.allergy_items = input.allergyItems;
  if (input.medicalConditions !== undefined) {
    patch.medical_conditions = input.medicalConditions;
  }
  if (input.physicianName !== undefined) patch.physician_name = input.physicianName;
  if (input.physicianPhone !== undefined) {
    patch.physician_phone = input.physicianPhone || null;
  }
  if (input.insuranceInfo !== undefined) patch.insurance_info = input.insuranceInfo;
  if (input.medications !== undefined) {
    patch.medications = medicationsToJsonb(input.medications);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update(patch)
    .eq("id", childId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, code: "updateFailed" };

  if (input.medications !== undefined) {
    await syncMedications(parentId, childId, input.medications);
  }
  if (input.emergencyContacts !== undefined) {
    await syncEmergencyContacts(parentId, childId, input.emergencyContacts);
  }

  const child = await getChildForParent(parentId, childId);
  if (!child) return { ok: false, code: "notFound" };
  return { ok: true, child };
}

export async function deleteChildForParent(
  parentId: string,
  childId: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("child_id", childId)
    .eq("parent_id", parentId)
    .in("status", ["pending", "active"]);

  if ((count ?? 0) > 0) {
    return { ok: false, code: "activeRegistration" };
  }

  const { data: child } = await supabase
    .from("children")
    .select("photo_url")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!child) return { ok: false, code: "notFound" };

  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", childId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, code: "deleteFailed" };

  if (child.photo_url) {
    try {
      const service = createServiceClient();
      await service.storage.from(PHOTO_BUCKET).remove([child.photo_url]);
    } catch {
      // non-blocking cleanup
    }
  }

  return { ok: true };
}

export async function uploadChildPhoto(
  parentId: string,
  childId: string,
  file: File,
): Promise<
  | { ok: true; photoPath: string; signedUrl: string }
  | { ok: false; code: string }
> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("photo_url")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!child) return { ok: false, code: "notFound" };

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${parentId}/${childId}/photo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const service = createServiceClient();
  const { error: uploadError } = await service.storage
    .from(PHOTO_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { ok: false, code: "uploadFailed" };

  if (child.photo_url && child.photo_url !== path) {
    await service.storage.from(PHOTO_BUCKET).remove([child.photo_url]);
  }

  await supabase
    .from("children")
    .update({ photo_url: path, updated_at: new Date().toISOString() })
    .eq("id", childId)
    .eq("parent_id", parentId);

  const signedUrl = await signedPhotoUrl(parentId, path);
  if (!signedUrl) return { ok: false, code: "uploadFailed" };

  return { ok: true, photoPath: path, signedUrl };
}
