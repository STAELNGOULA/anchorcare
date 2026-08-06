import type {
  CreateCoachInviteInput,
  PendingCoachInvite,
  TeamMemberItem,
  TeamProgramOption,
  UpdateTeamMemberInput,
} from "@/lib/business/team-types";
import { createCoachInvite } from "@/lib/invites/invite-service";
import { isDirectorOfOrg } from "@/lib/business/org-profile-service";
import { createServiceClient } from "@/lib/supabase/service";

type OrgMemberRow = {
  user_id: string;
  role: string;
  created_at: string;
  deactivated_at: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function orgMembersTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("org_members" as "profiles");
}

export async function listTeamPrograms(orgId: string): Promise<TeamProgramOption[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("programs")
    .select("id, name, status")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
  }));
}

export async function listTeamMembers(orgId: string): Promise<TeamMemberItem[]> {
  const service = createServiceClient();
  const { data: members } = await orgMembersTable(service)
    .select("user_id, role, created_at, deactivated_at")
    .eq("org_id", orgId)
    .in("role", ["coach", "staff"])
    .order("created_at", { ascending: true });

  const memberRows = (members ?? []) as OrgMemberRow[];
  if (!memberRows.length) return [];

  const userIds = memberRows.map((m: OrgMemberRow) => m.user_id);
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name?.trim() || ""]),
  );

  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id: string) => {
      const { data } = await service.auth.admin.getUserById(id);
      if (data.user?.email) emailMap.set(id, data.user.email);
    }),
  );

  const { data: assignments } = await service
    .from("program_coaches")
    .select("user_id, program_id, programs(name)")
    .eq("org_id", orgId)
    .in("user_id", userIds);

  const programsByUser = new Map<string, { ids: string[]; names: string[] }>();
  for (const row of assignments ?? []) {
    const entry = programsByUser.get(row.user_id) ?? { ids: [], names: [] };
    entry.ids.push(row.program_id);
    const program = row.programs as { name: string } | null;
    if (program?.name) entry.names.push(program.name);
    programsByUser.set(row.user_id, entry);
  }

  return memberRows.map((member: OrgMemberRow) => {
    const programs = programsByUser.get(member.user_id) ?? { ids: [], names: [] };
    return {
      userId: member.user_id,
      email: emailMap.get(member.user_id) ?? "",
      fullName: profileMap.get(member.user_id) || emailMap.get(member.user_id) || "Coach",
      role: member.role as TeamMemberItem["role"],
      isActive: !member.deactivated_at,
      deactivatedAt: member.deactivated_at,
      programIds: programs.ids,
      programNames: programs.names,
      joinedAt: member.created_at,
    };
  });
}

export async function listPendingCoachInvites(
  orgId: string,
): Promise<PendingCoachInvite[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("invites")
    .select("id, email, metadata, expires_at, created_at, token")
    .eq("org_id", orgId)
    .eq("invite_type", "coach")
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  return (data ?? []).map((row) => {
    const metadata = (row.metadata ?? {}) as {
      program_ids?: string[];
      assign_all?: boolean;
    };
    return {
      id: row.id,
      email: row.email,
      programIds: metadata.program_ids ?? [],
      assignAllPrograms: Boolean(metadata.assign_all),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      inviteUrl: `${base}/invite/${row.token}`,
    };
  });
}

export async function inviteCoach(
  directorId: string,
  orgId: string,
  input: CreateCoachInviteInput,
): Promise<{ inviteUrl: string; expiresAt: string } | { error: string }> {
  if (!(await isDirectorOfOrg(directorId, orgId))) {
    return { error: "forbidden" };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "email_required" };

  if (!input.assignAllPrograms && input.programIds.length === 0) {
    return { error: "programs_required" };
  }

  try {
    const invite = await createCoachInvite({
      orgId,
      email,
      programIds: input.programIds,
      assignAllPrograms: input.assignAllPrograms,
    });
    return invite;
  } catch {
    return { error: "invite_failed" };
  }
}

export async function updateTeamMember(
  directorId: string,
  orgId: string,
  memberUserId: string,
  input: UpdateTeamMemberInput,
): Promise<{ ok: true } | { error: string }> {
  if (!(await isDirectorOfOrg(directorId, orgId))) {
    return { error: "forbidden" };
  }

  const service = createServiceClient();
  const { data: member } = await orgMembersTable(service)
    .select("user_id, role")
    .eq("org_id", orgId)
    .eq("user_id", memberUserId)
    .in("role", ["coach", "staff"])
    .maybeSingle();

  if (!member) return { error: "not_found" };

  const now = new Date().toISOString();

  if (!input.isActive) {
    await orgMembersTable(service)
      .update({ deactivated_at: now })
      .eq("org_id", orgId)
      .eq("user_id", memberUserId);

    await service
      .from("program_coaches")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", memberUserId);

    return { ok: true };
  }

  await orgMembersTable(service)
    .update({ deactivated_at: null })
    .eq("org_id", orgId)
    .eq("user_id", memberUserId);

  await service
    .from("program_coaches")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", memberUserId);

  let programIds = input.programIds;
  if (input.assignAllPrograms) {
    const { data: programs } = await service
      .from("programs")
      .select("id")
      .eq("org_id", orgId)
      .neq("status", "archived");
    programIds = (programs ?? []).map((p) => p.id);
  }

  if (programIds.length > 0) {
    const rows = programIds.map((programId) => ({
      org_id: orgId,
      program_id: programId,
      user_id: memberUserId,
    }));
    await service.from("program_coaches").upsert(rows, {
      onConflict: "program_id,user_id",
      ignoreDuplicates: true,
    });
  }

  return { ok: true };
}

export async function isCoachActiveInOrg(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await orgMembersTable(service)
    .select("deactivated_at")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return false;
  return !data.deactivated_at;
}
