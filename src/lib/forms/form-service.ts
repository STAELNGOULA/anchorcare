import type {
  CreateParentFormInput,
  ParentFormExpiring,
  ParentFormRecord,
  ParentFormType,
} from "@/lib/forms/form-types";
import { parentFormsTable } from "@/lib/forms/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

const FORMS_BUCKET = "parent-forms";
const SIGNED_URL_TTL = 3600;

type FormRow = {
  id: string;
  parent_id: string;
  child_id: string | null;
  program_id: string | null;
  form_type: ParentFormType;
  title: string;
  file_path: string;
  file_mime: string | null;
  expires_at: string | null;
  created_at: string;
};

function daysUntil(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateIso);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86_400_000);
}

async function signedFormUrl(filePath: string): Promise<string | null> {
  try {
    const service = createServiceClient();
    const { data, error } = await service.storage
      .from(FORMS_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

async function childNameMap(
  childIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (childIds.length === 0) return map;
  const service = createServiceClient();
  const { data } = await service
    .from("children")
    .select("id, first_name, last_name")
    .in("id", childIds);
  for (const row of data ?? []) {
    map.set(row.id, `${row.first_name} ${row.last_name}`.trim());
  }
  return map;
}

async function programNameMap(
  programIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (programIds.length === 0) return map;
  const service = createServiceClient();
  const { data } = await service
    .from("programs")
    .select("id, name")
    .in("id", programIds);
  for (const row of data ?? []) {
    map.set(row.id, row.name);
  }
  return map;
}

async function mapFormRow(row: FormRow): Promise<ParentFormRecord> {
  const childIds = row.child_id ? [row.child_id] : [];
  const programIds = row.program_id ? [row.program_id] : [];
  const [children, programs, signedUrl] = await Promise.all([
    childNameMap(childIds),
    programNameMap(programIds),
    signedFormUrl(row.file_path),
  ]);

  return {
    id: row.id,
    title: row.title,
    formType: row.form_type,
    childId: row.child_id,
    childName: row.child_id ? children.get(row.child_id) ?? null : null,
    programId: row.program_id,
    programName: row.program_id ? programs.get(row.program_id) ?? null : null,
    expiresAt: row.expires_at,
    fileMime: row.file_mime,
    signedUrl,
    createdAt: row.created_at,
    daysUntilExpiry: row.expires_at ? daysUntil(row.expires_at) : null,
  };
}

export async function listParentForms(
  parentId: string,
): Promise<ParentFormRecord[]> {
  const service = createServiceClient();
  const { data } = await parentFormsTable(service)
    .select(
      "id, parent_id, child_id, program_id, form_type, title, file_path, file_mime, expires_at, created_at",
    )
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as FormRow[];
  return Promise.all(rows.map((row) => mapFormRow(row)));
}

export async function listExpiringFormsForParent(
  parentId: string,
  withinDays = 30,
): Promise<ParentFormExpiring[]> {
  const service = createServiceClient();
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + withinDays);

  const { data } = await parentFormsTable(service)
    .select("id, title, expires_at")
    .eq("parent_id", parentId)
    .not("expires_at", "is", null)
    .lte("expires_at", horizon.toISOString().slice(0, 10))
    .gte("expires_at", today.toISOString().slice(0, 10))
    .order("expires_at", { ascending: true });

  return (data ?? []).map((row: { id: string; title: string; expires_at: string }) => ({
    id: row.id,
    title: row.title,
    expiresAt: row.expires_at,
    daysUntil: daysUntil(row.expires_at),
  }));
}

export async function createParentFormRecord(
  parentId: string,
  input: CreateParentFormInput,
  file: File,
): Promise<
  | { ok: true; form: ParentFormRecord }
  | { ok: false; error: "invalidFile" | "childNotFound" | "saveFailed" }
> {
  const allowed = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  if (!allowed.has(file.type) || file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "invalidFile" };
  }

  const service = createServiceClient();

  if (input.childId) {
    const { data: child } = await service
      .from("children")
      .select("id")
      .eq("id", input.childId)
      .eq("parent_id", parentId)
      .maybeSingle();
    if (!child) return { ok: false, error: "childNotFound" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const objectPath = `${parentId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await service.storage
    .from(FORMS_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { ok: false, error: "saveFailed" };

  const { data: inserted, error } = await parentFormsTable(service)
    .insert({
      parent_id: parentId,
      child_id: input.childId ?? null,
      program_id: input.programId ?? null,
      form_type: input.formType,
      title: input.title.trim(),
      file_path: objectPath,
      file_mime: file.type,
      expires_at: input.expiresAt ?? null,
    })
    .select(
      "id, parent_id, child_id, program_id, form_type, title, file_path, file_mime, expires_at, created_at",
    )
    .single();

  if (error || !inserted) {
    await service.storage.from(FORMS_BUCKET).remove([objectPath]);
    return { ok: false, error: "saveFailed" };
  }

  const form = await mapFormRow(inserted as FormRow);
  return { ok: true, form };
}

export async function deleteParentForm(
  parentId: string,
  formId: string,
): Promise<{ ok: true } | { ok: false; error: "notFound" }> {
  const service = createServiceClient();
  const { data: row } = await parentFormsTable(service)
    .select("id, file_path")
    .eq("id", formId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!row) return { ok: false, error: "notFound" };

  await parentFormsTable(service).delete().eq("id", formId);
  await service.storage.from(FORMS_BUCKET).remove([row.file_path as string]);

  return { ok: true };
}

export async function updateParentFormMeta(
  parentId: string,
  formId: string,
  patch: {
    title?: string;
    formType?: ParentFormType;
    childId?: string | null;
    programId?: string | null;
    expiresAt?: string | null;
  },
): Promise<
  | { ok: true; form: ParentFormRecord }
  | { ok: false; error: "notFound" | "childNotFound" }
> {
  const service = createServiceClient();

  if (patch.childId) {
    const { data: child } = await service
      .from("children")
      .select("id")
      .eq("id", patch.childId)
      .eq("parent_id", parentId)
      .maybeSingle();
    if (!child) return { ok: false, error: "childNotFound" };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.formType !== undefined) updates.form_type = patch.formType;
  if (patch.childId !== undefined) updates.child_id = patch.childId;
  if (patch.programId !== undefined) updates.program_id = patch.programId;
  if (patch.expiresAt !== undefined) updates.expires_at = patch.expiresAt;

  const { data: updated, error } = await parentFormsTable(service)
    .update(updates)
    .eq("id", formId)
    .eq("parent_id", parentId)
    .select(
      "id, parent_id, child_id, program_id, form_type, title, file_path, file_mime, expires_at, created_at",
    )
    .maybeSingle();

  if (error || !updated) return { ok: false, error: "notFound" };

  const form = await mapFormRow(updated as FormRow);
  return { ok: true, form };
}
