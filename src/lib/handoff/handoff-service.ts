import type { CreateHandoffNoteInput, HandoffNote } from "@/lib/handoff/handoff-types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handoffTable(client: { from: (table: string) => any }): any {
  return client.from("handoff_notes" as "organizations");
}

function todayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function loadAuthorNames(authorIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(authorIds)];
  if (unique.length === 0) return map;

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  for (const row of data ?? []) {
    map.set(row.id, row.full_name?.trim() || "Staff");
  }
  return map;
}

export async function listHandoffNotesForOrg(
  orgId: string,
  shiftDate?: string,
): Promise<HandoffNote[]> {
  const service = createServiceClient();
  const date = shiftDate ?? todayDateString();

  const { data: rows } = await handoffTable(service)
    .select(
      "id, org_id, program_id, author_id, shift_date, note, created_at, programs(name)",
    )
    .eq("org_id", orgId)
    .eq("shift_date", date)
    .order("created_at", { ascending: false });

  const authorIds = (rows ?? []).map((r: { author_id: string }) => r.author_id);
  const authors = await loadAuthorNames(authorIds);

  return (rows ?? []).map((row: {
    id: string;
    org_id: string;
    program_id: string;
    author_id: string;
    shift_date: string;
    note: string;
    created_at: string;
    programs: { name: string } | null;
  }) => ({
    id: row.id,
    orgId: row.org_id,
    programId: row.program_id,
    programName: row.programs?.name ?? "Program",
    authorId: row.author_id,
    authorName: authors.get(row.author_id) ?? "Staff",
    shiftDate: row.shift_date,
    note: row.note,
    createdAt: row.created_at,
  }));
}

export async function createHandoffNote(
  userId: string,
  orgId: string,
  input: CreateHandoffNoteInput,
): Promise<HandoffNote | { error: string }> {
  const note = input.note.trim();
  if (!note) return { error: "note_required" };

  const service = createServiceClient();
  const { data: program } = await service
    .from("programs")
    .select("id, org_id, name")
    .eq("id", input.programId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!program) return { error: "forbidden" };

  const shiftDate = input.shiftDate ?? todayDateString();
  const now = new Date().toISOString();

  const { data, error } = await handoffTable(service)
    .insert({
      org_id: orgId,
      program_id: input.programId,
      author_id: userId,
      shift_date: shiftDate,
      note,
      created_at: now,
      updated_at: now,
    })
    .select("id, org_id, program_id, author_id, shift_date, note, created_at")
    .single();

  if (error || !data) return { error: "save_failed" };

  const authors = await loadAuthorNames([userId]);

  return {
    id: data.id,
    orgId: data.org_id,
    programId: data.program_id,
    programName: program.name,
    authorId: data.author_id,
    authorName: authors.get(userId) ?? "Staff",
    shiftDate: data.shift_date,
    note: data.note,
    createdAt: data.created_at,
  };
}

export async function getDirectorOrgIdForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .eq("role", "director")
    .maybeSingle();
  return data?.org_id ?? null;
}
