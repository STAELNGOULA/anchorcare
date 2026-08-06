import type { Json } from "@/types/supabase";
import { randomBytes } from "node:crypto";
import { hashInviteToken } from "@/lib/invites/token";
import type { InviteDetail } from "@/lib/invites/types";
import { createServiceClient } from "@/lib/supabase/service";

type InviteRow = {
  id: string;
  token: string;
  invite_type: "parent" | "coach";
  email: string | null;
  program_name: string;
  child_first_name: string | null;
  org_id: string | null;
  program_id: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  organizations?: { name: string; public_slug: string; logo_url: string | null } | null;
  programs?: { name: string; start_date: string | null } | null;
};

function mapInvite(row: InviteRow): InviteDetail {
  return {
    id: row.id,
    token: row.token,
    inviteType: row.invite_type,
    email: row.email,
    programName: row.programs?.name ?? row.program_name,
    childFirstName: row.child_first_name,
    orgId: row.org_id,
    programId: row.program_id,
    orgName: row.organizations?.name ?? null,
    orgLogoUrl: row.organizations?.logo_url ?? null,
    orgSlug: row.organizations?.public_slug ?? null,
    programStartDate: row.programs?.start_date ?? null,
    programEndDate: null,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    usedBy: row.used_by,
  };
}

export async function getInviteDetailByToken(
  token: string,
): Promise<InviteDetail | null> {
  if (!token || token.length < 8) return null;

  const supabase = createServiceClient();
  const tokenHash = hashInviteToken(token);

  const { data, error } = await supabase
    .from("invites")
    .select(
      `
      id,
      token,
      invite_type,
      email,
      program_name,
      child_first_name,
      org_id,
      program_id,
      expires_at,
      used_at,
      used_by,
      organizations ( name, public_slug, logo_url ),
      programs ( name, start_date )
    `,
    )
    .or(`token_hash.eq.${tokenHash},token.eq.${token}`)
    .maybeSingle();

  if (error || !data) return null;
  return mapInvite(data as unknown as InviteRow);
}

export function isInviteExpired(invite: InviteDetail): boolean {
  return new Date(invite.expiresAt).getTime() < Date.now();
}

export function isInviteUsed(invite: InviteDetail): boolean {
  return Boolean(invite.usedAt);
}

export function emailsMatch(
  inviteEmail: string | null,
  userEmail: string | null,
): boolean {
  if (!inviteEmail || !userEmail) return true;
  return inviteEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
}

export async function createParentInvite(input: {
  orgId: string;
  programId: string;
  email?: string;
  childFirstName?: string;
  expiresInDays?: number;
}): Promise<{ token: string; inviteUrl: string; expiresAt: string }> {
  const supabase = createServiceClient();
  const token =
    randomBytes(24).toString("hex") + randomBytes(4).toString("hex");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 7));

  const { data: program } = await supabase
    .from("programs")
    .select("name, org_id")
    .eq("id", input.programId)
    .eq("org_id", input.orgId)
    .maybeSingle();

  if (!program) throw new Error("program_not_found");

  const { error } = await supabase.from("invites").insert({
    token,
    token_hash: tokenHash,
    invite_type: "parent",
    email: input.email ?? null,
    program_name: program.name,
    child_first_name: input.childFirstName ?? null,
    org_id: input.orgId,
    program_id: input.programId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  return {
    token,
    inviteUrl: `${base}/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resendParentInvite(
  orgId: string,
  inviteId: string,
): Promise<{ ok: true; inviteUrl: string } | { ok: false; code: string }> {
  const supabase = createServiceClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, token, used_at, org_id")
    .eq("id", inviteId)
    .eq("org_id", orgId)
    .eq("invite_type", "parent")
    .maybeSingle();

  if (!invite) return { ok: false, code: "notFound" };
  if (invite.used_at) return { ok: false, code: "alreadyUsed" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from("invites")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("id", inviteId);

  if (error) return { ok: false, code: "resendFailed" };

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  return { ok: true, inviteUrl: `${base}/invite/${invite.token}` };
}

export async function createCoachInvite(input: {
  orgId: string;
  email: string;
  programIds?: string[];
  assignAllPrograms?: boolean;
  expiresInDays?: number;
}): Promise<{ token: string; inviteUrl: string; expiresAt: string }> {
  const supabase = createServiceClient();
  const token =
    randomBytes(24).toString("hex") + randomBytes(4).toString("hex");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 14));

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", input.orgId)
    .maybeSingle();

  const metadata: Record<string, unknown> = {
    program_ids: input.programIds ?? [],
    assign_all: Boolean(input.assignAllPrograms),
  };

  const { error } = await supabase.from("invites").insert({
    token,
    token_hash: tokenHash,
    invite_type: "coach",
    email: input.email.trim().toLowerCase(),
    program_name: org?.name ?? "Your organization",
    org_id: input.orgId,
    program_id: null,
    metadata: metadata as Json,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  return {
    token,
    inviteUrl: `${base}/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}
