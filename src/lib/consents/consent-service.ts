import type {
  ParentNotificationPreferences,
  ProgramConsentItem,
  UpdateNotificationPreferencesInput,
  UpdateProgramConsentInput,
} from "@/lib/consents/consent-types";
import { isValidQuietHoursTime } from "@/lib/consents/quiet-hours";
import { enqueueJob } from "@/lib/jobs/processor";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ConsentRow = {
  registration_id: string;
  child_id: string;
  program_id: string;
  org_id: string;
  share_photos: boolean;
  share_allergies: boolean;
  share_meds: boolean;
  share_contacts: boolean;
};

type RegistrationRow = {
  id: string;
  child_id: string;
  program_id: string;
  status: string;
  children: { first_name: string; last_name: string } | null;
  programs: { name: string; organizations: { name: string } | null } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function consentsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("emergency_program_consents" as "program_registrations");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notificationPrefsTable(
  service: ReturnType<typeof createServiceClient>,
): any {
  return service.from("parent_notification_preferences" as "profiles");
}

function mapNotificationPrefs(row: {
  push_enabled: boolean;
  sms_enabled: boolean;
  email_digest_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}): ParentNotificationPreferences {
  const start = row.quiet_hours_start?.slice(0, 5) ?? "21:00";
  const end = row.quiet_hours_end?.slice(0, 5) ?? "07:00";
  return {
    pushEnabled: row.push_enabled,
    smsEnabled: row.sms_enabled,
    emailDigestEnabled: row.email_digest_enabled,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: start,
    quietHoursEnd: end,
    timezone: row.timezone,
  };
}

const DEFAULT_NOTIFICATION_PREFS: ParentNotificationPreferences = {
  pushEnabled: true,
  smsEnabled: true,
  emailDigestEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "21:00",
  quietHoursEnd: "07:00",
  timezone: "America/Toronto",
};

export async function listParentProgramConsents(
  parentId: string,
): Promise<ProgramConsentItem[]> {
  const supabase = await createClient();
  const { data: registrations } = await supabase
    .from("program_registrations")
    .select(
      `
      id,
      child_id,
      program_id,
      status,
      children ( first_name, last_name ),
      programs ( name, organizations ( name ) )
    `,
    )
    .eq("parent_id", parentId)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false });

  if (!registrations?.length) return [];

  const registrationIds = registrations.map((r) => r.id);
  const service = createServiceClient();
  const { data: consentRows } = await consentsTable(service)
    .select(
      "registration_id, child_id, program_id, org_id, share_photos, share_allergies, share_meds, share_contacts",
    )
    .in("registration_id", registrationIds);

  const consentMap = new Map(
    ((consentRows ?? []) as ConsentRow[]).map((row) => [
      row.registration_id,
      row,
    ]),
  );

  return (registrations as RegistrationRow[]).map((reg) => {
    const consent = consentMap.get(reg.id);
    const child = reg.children;
    const program = reg.programs;
    const shareMedical =
      (consent?.share_allergies ?? true) && (consent?.share_meds ?? true);
    const shareEmergency = consent?.share_contacts ?? true;

    return {
      registrationId: reg.id,
      childId: reg.child_id,
      childName: [child?.first_name, child?.last_name].filter(Boolean).join(" "),
      programId: reg.program_id,
      programName: program?.name ?? "Program",
      orgName: program?.organizations?.name ?? "Organization",
      status: reg.status as ProgramConsentItem["status"],
      sharePhotos: consent?.share_photos ?? true,
      shareMedical,
      shareEmergency,
    };
  });
}

export async function getParentNotificationPreferences(
  parentId: string,
): Promise<ParentNotificationPreferences> {
  const supabase = await createClient();
  const { data } = await notificationPrefsTable(supabase)
    .select(
      "push_enabled, sms_enabled, email_digest_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone",
    )
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_NOTIFICATION_PREFS };

  return mapNotificationPrefs(data);
}

export async function updateProgramConsent(
  parentId: string,
  input: UpdateProgramConsentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("program_registrations")
    .select("id, parent_id, program_id, org_id")
    .eq("id", input.registrationId)
    .eq("parent_id", parentId)
    .maybeSingle();

  if (!reg) return { ok: false, error: "not_found" };

  const patch: Record<string, boolean> = {};
  if (input.sharePhotos !== undefined) patch.share_photos = input.sharePhotos;
  if (input.shareMedical !== undefined) {
    patch.share_allergies = input.shareMedical;
    patch.share_meds = input.shareMedical;
  }
  if (input.shareEmergency !== undefined) {
    patch.share_contacts = input.shareEmergency;
  }

  if (Object.keys(patch).length === 0) return { ok: true };

  const service = createServiceClient();
  const { error } = await consentsTable(service)
    .update(patch)
    .eq("registration_id", input.registrationId)
    .eq("parent_id", parentId);

  if (error) return { ok: false, error: "save_failed" };

  await enqueueJob({
    type: "consent_change_notify_program",
    payload: {
      registrationId: input.registrationId,
      programId: reg.program_id,
      orgId: reg.org_id,
      parentId,
    },
    idempotencyKey: `consent-notify:${input.registrationId}:${Date.now()}`,
  });

  return { ok: true };
}

export async function updateParentNotificationPreferences(
  parentId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<{ ok: true; preferences: ParentNotificationPreferences } | { ok: false; error: string }> {
  if (
    (input.quietHoursStart && !isValidQuietHoursTime(input.quietHoursStart)) ||
    (input.quietHoursEnd && !isValidQuietHoursTime(input.quietHoursEnd))
  ) {
    return { ok: false, error: "invalid_time" };
  }

  const existing = await getParentNotificationPreferences(parentId);
  const merged: ParentNotificationPreferences = {
    ...existing,
    ...input,
  };

  const service = createServiceClient();
  const row = {
    parent_id: parentId,
    push_enabled: merged.pushEnabled,
    sms_enabled: merged.smsEnabled,
    email_digest_enabled: merged.emailDigestEnabled,
    quiet_hours_enabled: merged.quietHoursEnabled,
    quiet_hours_start: merged.quietHoursStart,
    quiet_hours_end: merged.quietHoursEnd,
    timezone: merged.timezone,
    updated_at: new Date().toISOString(),
  };

  const { error } = await notificationPrefsTable(service).upsert(row, {
    onConflict: "parent_id",
  });

  if (error) return { ok: false, error: "save_failed" };

  return { ok: true, preferences: merged };
}
