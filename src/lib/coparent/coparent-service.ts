import { randomBytes } from "node:crypto";
import type {
  CoparentChildState,
  CoparentWorkspaceData,
  CreateCoparentInviteInput,
  GuardianPermission,
} from "@/lib/coparent/coparent-types";
import {
  childGuardianInvitesTable,
  childGuardiansTable,
} from "@/lib/coparent/table-utils";
import { hashInviteToken } from "@/lib/invites/token";
import { enqueueJob } from "@/lib/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";

const INVITE_TTL_DAYS = 14;

type ChildRow = {
  id: string;
  first_name: string;
  last_name: string;
};

type GuardianRow = {
  id: string;
  child_id: string;
  guardian_user_id: string;
  permission: GuardianPermission;
  created_at: string;
};

type InviteRow = {
  id: string;
  child_id: string;
  invite_email: string;
  permission: GuardianPermission;
  status: string;
  expires_at: string;
  created_at: string;
};

async function profileMap(
  userIds: string[],
): Promise<Map<string, { email: string | null; name: string | null }>> {
  const map = new Map<string, { email: string | null; name: string | null }>();
  if (userIds.length === 0) return map;
  const service = createServiceClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  await Promise.all(
    userIds.map(async (id) => {
      const profile = profiles?.find((row) => row.id === id);
      const { data: authUser } = await service.auth.admin.getUserById(id);
      map.set(id, {
        email: authUser?.user?.email ?? null,
        name: profile?.full_name ?? null,
      });
    }),
  );
  return map;
}

export async function getCoparentWorkspaceData(
  primaryParentId: string,
): Promise<CoparentWorkspaceData> {
  const service = createServiceClient();
  const { data: childRows } = await service
    .from("children")
    .select("id, first_name, last_name")
    .eq("parent_id", primaryParentId)
    .order("created_at", { ascending: true });

  const children = (childRows ?? []) as ChildRow[];
  if (children.length === 0) return { children: [] };

  const childIds = children.map((c) => c.id);

  const [{ data: guardians }, { data: invites }] = await Promise.all([
    childGuardiansTable(service)
      .select("id, child_id, guardian_user_id, permission, created_at")
      .in("child_id", childIds),
    childGuardianInvitesTable(service)
      .select("id, child_id, invite_email, permission, status, expires_at, created_at")
      .eq("primary_parent_id", primaryParentId)
      .in("child_id", childIds)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()),
  ]);

  const guardianRows = (guardians ?? []) as GuardianRow[];
  const inviteRows = (invites ?? []) as InviteRow[];
  const guardianUserIds: string[] = [
    ...new Set(guardianRows.map((g) => g.guardian_user_id)),
  ];
  const profiles = await profileMap(guardianUserIds);

  const states: CoparentChildState[] = children.map((child) => {
    const childGuardians = guardianRows
      .filter((g) => g.child_id === child.id)
      .map((g) => {
        const profile = profiles.get(g.guardian_user_id);
        return {
          id: g.id,
          childId: g.child_id,
          guardianUserId: g.guardian_user_id,
          guardianEmail: profile?.email ?? null,
          guardianName: profile?.name ?? null,
          permission: g.permission,
          createdAt: g.created_at,
        };
      });

    const pendingInvites = inviteRows
      .filter((i) => i.child_id === child.id)
      .map((i) => ({
        id: i.id,
        childId: i.child_id,
        inviteEmail: i.invite_email,
        permission: i.permission,
        status: i.status as CoparentChildState["pendingInvites"][0]["status"],
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      }));

    return {
      childId: child.id,
      firstName: child.first_name,
      lastName: child.last_name,
      guardians: childGuardians,
      pendingInvites,
    };
  });

  return { children: states };
}

export async function createCoparentInvite(
  primaryParentId: string,
  input: CreateCoparentInviteInput,
): Promise<
  | { ok: true; inviteId: string; token: string }
  | { ok: false; error: "notFound" | "invalidEmail" | "alreadyInvited" | "selfInvite" }
> {
  const email = input.inviteEmail.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "invalidEmail" };

  const service = createServiceClient();

  const { data: child } = await service
    .from("children")
    .select("id, parent_id")
    .eq("id", input.childId)
    .eq("parent_id", primaryParentId)
    .maybeSingle();
  if (!child) return { ok: false, error: "notFound" };

  const { data: authPrimary } = await service.auth.admin.getUserById(primaryParentId);
  if (authPrimary?.user?.email?.toLowerCase() === email) {
    return { ok: false, error: "selfInvite" };
  }

  const { data: existingInvite } = await childGuardianInvitesTable(service)
    .select("id")
    .eq("child_id", input.childId)
    .eq("invite_email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (existingInvite) return { ok: false, error: "alreadyInvited" };

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const { data: inserted, error } = await childGuardianInvitesTable(service)
    .insert({
      child_id: input.childId,
      primary_parent_id: primaryParentId,
      invite_email: email,
      permission: input.permission,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "notFound" };
  }

  await enqueueJob({
    type: "coparent_invite_email",
    idempotencyKey: `coparent_invite:${inserted.id}`,
    payload: {
      inviteId: inserted.id,
      email,
      childId: input.childId,
    },
  });

  return { ok: true, inviteId: inserted.id, token };
}

export async function revokeCoparentInvite(
  primaryParentId: string,
  inviteId: string,
): Promise<{ ok: true } | { ok: false; error: "notFound" }> {
  const service = createServiceClient();
  const { data } = await childGuardianInvitesTable(service)
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("primary_parent_id", primaryParentId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!data) return { ok: false, error: "notFound" };
  return { ok: true };
}

export async function revokeCoparentGuardian(
  primaryParentId: string,
  guardianId: string,
): Promise<{ ok: true } | { ok: false; error: "notFound" }> {
  const service = createServiceClient();

  const { data: guardian } = await childGuardiansTable(service)
    .select("id, child_id")
    .eq("id", guardianId)
    .maybeSingle();

  if (!guardian) return { ok: false, error: "notFound" };

  const { data: child } = await service
    .from("children")
    .select("id")
    .eq("id", guardian.child_id)
    .eq("parent_id", primaryParentId)
    .maybeSingle();
  if (!child) return { ok: false, error: "notFound" };

  await childGuardiansTable(service).delete().eq("id", guardianId);
  return { ok: true };
}

export type CoparentInvitePreview = {
  inviteId: string;
  childFirstName: string;
  childLastName: string;
  primaryParentName: string | null;
  permission: GuardianPermission;
  inviteEmail: string;
  expired: boolean;
  used: boolean;
};

export async function getCoparentInviteByToken(
  token: string,
): Promise<CoparentInvitePreview | null> {
  const service = createServiceClient();
  const tokenHash = hashInviteToken(token);

  const { data: invite } = await childGuardianInvitesTable(service)
    .select(
      "id, child_id, invite_email, permission, status, expires_at, primary_parent_id, children(first_name, last_name)",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite) return null;

  const child = invite.children as { first_name: string; last_name: string } | null;
  const { data: primary } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", invite.primary_parent_id)
    .maybeSingle();

  return {
    inviteId: invite.id,
    childFirstName: child?.first_name ?? "",
    childLastName: child?.last_name ?? "",
    primaryParentName: primary?.full_name ?? null,
    permission: invite.permission,
    inviteEmail: invite.invite_email,
    expired:
      invite.status !== "pending" ||
      new Date(invite.expires_at).getTime() < Date.now(),
    used: invite.status === "accepted",
  };
}

export async function acceptCoparentInvite(
  userId: string,
  userEmail: string | null,
  token: string,
): Promise<
  | { ok: true; childId: string }
  | {
      ok: false;
      error: "notFound" | "expired" | "wrongEmail" | "alreadyGuardian";
    }
> {
  const service = createServiceClient();
  const tokenHash = hashInviteToken(token);

  const { data: invite } = await childGuardianInvitesTable(service)
    .select("id, child_id, invite_email, permission, status, expires_at, primary_parent_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!invite) return { ok: false, error: "notFound" };
  if (invite.status !== "pending") {
    return { ok: false, error: invite.status === "accepted" ? "alreadyGuardian" : "expired" };
  }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await childGuardianInvitesTable(service)
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invite.id);
    return { ok: false, error: "expired" };
  }

  if (
    !userEmail ||
    userEmail.trim().toLowerCase() !== invite.invite_email.trim().toLowerCase()
  ) {
    return { ok: false, error: "wrongEmail" };
  }

  if (invite.primary_parent_id === userId) {
    return { ok: false, error: "wrongEmail" };
  }

  const { data: existing } = await childGuardiansTable(service)
    .select("id")
    .eq("child_id", invite.child_id)
    .eq("guardian_user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, error: "alreadyGuardian" };

  const now = new Date().toISOString();
  const { error: guardianError } = await childGuardiansTable(service).insert({
    child_id: invite.child_id,
    guardian_user_id: userId,
    permission: invite.permission,
    invited_by: invite.primary_parent_id,
  });

  if (guardianError) return { ok: false, error: "notFound" };

  await childGuardianInvitesTable(service)
    .update({
      status: "accepted",
      guardian_user_id: userId,
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", invite.id);

  return { ok: true, childId: invite.child_id };
}
