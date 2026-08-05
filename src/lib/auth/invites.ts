import { createServiceClient } from "@/lib/supabase/service";
import type { InviteRow } from "@/types/supabase";

export type InvitePreview = {
  token: string;
  programName: string;
  childFirstName: string | null;
  email: string | null;
  expired: boolean;
  used: boolean;
};

export async function getInviteByToken(
  token: string,
): Promise<InviteRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export function toInvitePreview(invite: InviteRow): InvitePreview {
  const now = Date.now();
  const expires = new Date(invite.expires_at).getTime();
  return {
    token: invite.token,
    programName: invite.program_name,
    childFirstName: invite.child_first_name,
    email: invite.email,
    expired: expires < now,
    used: Boolean(invite.used_at),
  };
}

export async function acceptInviteForUser(
  token: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const supabase = createServiceClient();
  const invite = await getInviteByToken(token);

  if (!invite) return { ok: false, code: "inviteNotFound" };
  if (invite.used_at) return { ok: false, code: "inviteUsed" };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false, code: "inviteExpired" };
  }

  const now = new Date().toISOString();

  const { error: inviteError } = await supabase
    .from("invites")
    .update({ used_at: now, used_by: userId })
    .eq("token", token)
    .is("used_at", null);

  if (inviteError) return { ok: false, code: "inviteAcceptFailed" };

  const role = invite.invite_type === "coach" ? "coach" : "parent";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role,
      onboarding_status: "active",
      updated_at: now,
    })
    .eq("id", userId);

  if (profileError) return { ok: false, code: "profileUpdateFailed" };

  return { ok: true };
}
