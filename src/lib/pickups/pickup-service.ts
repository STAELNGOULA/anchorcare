import type {
  AuthorizedPickup,
  ParentPickupChild,
  PickupOverride,
} from "@/lib/pickups/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PHOTO_BUCKET = "pickup-photos";
const SIGNED_URL_TTL = 3600;

type AuthorizedRow = {
  id: string;
  child_id: string;
  name: string;
  relation: string;
  phone: string;
  photo_url: string | null;
  sort_order: number;
};

type OverrideRow = {
  id: string;
  child_id: string;
  authorized_pickup_id: string | null;
  person_name: string;
  note: string | null;
  valid_date: string;
  until_time: string | null;
  timezone: string;
  expires_at: string;
};

function localDateString(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

function mapAuthorized(
  row: AuthorizedRow,
  photoSignedUrl: string | null,
): AuthorizedPickup {
  return {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    relation: row.relation,
    phone: row.phone,
    photoSignedUrl,
    sortOrder: row.sort_order,
  };
}

function mapOverride(row: OverrideRow): PickupOverride {
  return {
    id: row.id,
    childId: row.child_id,
    personName: row.person_name,
    note: row.note,
    validDate: row.valid_date,
    untilTime: row.until_time,
    timezone: row.timezone,
    expiresAt: row.expires_at,
    authorizedPickupId: row.authorized_pickup_id,
  };
}

export async function listParentPickupChildren(
  parentId: string,
): Promise<ParentPickupChild[]> {
  const supabase = await createClient();
  const { data: childRows } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (!childRows?.length) return [];

  const childIds = childRows.map((c) => c.id);

  const [{ data: authorizedRows }, { data: overrideRows }] = await Promise.all([
    supabase
      .from("authorized_pickups")
      .select("id, child_id, name, relation, phone, photo_url, sort_order")
      .eq("parent_id", parentId)
      .in("child_id", childIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("pickup_overrides")
      .select(
        "id, child_id, authorized_pickup_id, person_name, note, valid_date, until_time, timezone, expires_at",
      )
      .eq("parent_id", parentId)
      .in("child_id", childIds)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const authorizedByChild = new Map<string, AuthorizedRow[]>();
  for (const row of (authorizedRows ?? []) as AuthorizedRow[]) {
    const list = authorizedByChild.get(row.child_id) ?? [];
    list.push(row);
    authorizedByChild.set(row.child_id, list);
  }

  const overrideByChild = new Map<string, OverrideRow>();
  for (const row of (overrideRows ?? []) as OverrideRow[]) {
    overrideByChild.set(row.child_id, row);
  }

  const results: ParentPickupChild[] = [];
  for (const child of childRows) {
    const authRows = authorizedByChild.get(child.id) ?? [];
    const authorized = await Promise.all(
      authRows.map(async (row) =>
        mapAuthorized(row, await signedPhotoUrl(parentId, row.photo_url)),
      ),
    );
    const overrideRow = overrideByChild.get(child.id);

    results.push({
      childId: child.id,
      firstName: child.first_name,
      lastName: child.last_name,
      authorized,
      todayOverride: overrideRow ? mapOverride(overrideRow) : null,
    });
  }

  return results;
}

export async function createAuthorizedPickup(
  parentId: string,
  input: {
    childId: string;
    name: string;
    relation: string;
    phone: string;
  },
): Promise<{ ok: boolean; pickup?: AuthorizedPickup; error?: string }> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", input.childId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!child) return { ok: false, error: "not_found" };

  const { data, error } = await supabase
    .from("authorized_pickups")
    .insert({
      child_id: input.childId,
      parent_id: parentId,
      name: input.name.trim(),
      relation: input.relation.trim(),
      phone: input.phone.trim(),
    })
    .select("id, child_id, name, relation, phone, photo_url, sort_order")
    .single();

  if (error || !data) return { ok: false, error: "save_failed" };

  return {
    ok: true,
    pickup: mapAuthorized(data as AuthorizedRow, null),
  };
}

export async function deleteAuthorizedPickup(
  parentId: string,
  pickupId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("authorized_pickups")
    .delete()
    .eq("id", pickupId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, error: "delete_failed" };
  return { ok: true };
}

export async function setPickupOverride(
  parentId: string,
  input: {
    childId: string;
    personName: string;
    note?: string | null;
    untilTime?: string | null;
    timezone: string;
    authorizedPickupId?: string | null;
  },
): Promise<{ ok: boolean; override?: PickupOverride; error?: string }> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", input.childId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!child) return { ok: false, error: "not_found" };

  const validDate = localDateString(input.timezone);

  const { data, error } = await supabase
    .from("pickup_overrides")
    .upsert(
      {
        child_id: input.childId,
        parent_id: parentId,
        authorized_pickup_id: input.authorizedPickupId ?? null,
        person_name: input.personName.trim(),
        note: input.note?.trim() || null,
        valid_date: validDate,
        until_time: input.untilTime || null,
        timezone: input.timezone,
        expires_at: new Date().toISOString(),
      },
      { onConflict: "child_id,valid_date" },
    )
    .select(
      "id, child_id, authorized_pickup_id, person_name, note, valid_date, until_time, timezone, expires_at",
    )
    .single();

  if (error || !data) return { ok: false, error: "save_failed" };

  return { ok: true, override: mapOverride(data as OverrideRow) };
}

export async function clearPickupOverride(
  parentId: string,
  childId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pickup_overrides")
    .delete()
    .eq("child_id", childId)
    .eq("parent_id", parentId)
    .gt("expires_at", new Date().toISOString());

  if (error) return { ok: false, error: "delete_failed" };
  return { ok: true };
}

export async function uploadPickupPhoto(
  parentId: string,
  pickupId: string,
  file: File,
): Promise<{ ok: boolean; photoSignedUrl?: string; error?: string }> {
  const supabase = await createClient();
  const { data: pickup } = await supabase
    .from("authorized_pickups")
    .select("id, child_id, photo_url")
    .eq("id", pickupId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!pickup) return { ok: false, error: "not_found" };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${parentId}/${pickup.child_id}/${pickupId}.${ext}`;

  const service = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await service.storage
    .from(PHOTO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) return { ok: false, error: "upload_failed" };

  const { error: updateError } = await supabase
    .from("authorized_pickups")
    .update({ photo_url: path, updated_at: new Date().toISOString() })
    .eq("id", pickupId)
    .eq("parent_id", parentId);

  if (updateError) return { ok: false, error: "save_failed" };

  const photoSignedUrl = await signedPhotoUrl(parentId, path);
  return { ok: true, photoSignedUrl: photoSignedUrl ?? undefined };
}

export { localDateString };
