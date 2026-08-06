import type { AcceptParentInviteInput } from "@/lib/invites/types";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteResult =
  | { ok: true; redirectTo: string }
  | { ok: false; code: string };

function mapRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invite_not_found")) return "inviteNotFound";
  if (lower.includes("invite_used")) return "inviteUsed";
  if (lower.includes("invite_expired")) return "inviteExpired";
  if (lower.includes("child_not_found")) return "childNotFound";
  if (lower.includes("wrong_invite_type")) return "inviteWrongType";
  if (lower.includes("unauthorized")) return "notAuthenticated";
  return "inviteAcceptFailed";
}

export async function acceptParentInvite(
  userId: string,
  input: AcceptParentInviteInput,
): Promise<AcceptInviteResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_parent_invite", {
    p_user_id: userId,
    p_token: input.token,
    p_child_id: input.childId ?? undefined,
    p_new_child_first_name: input.newChild?.firstName ?? undefined,
    p_new_child_last_name: input.newChild?.lastName ?? undefined,
    p_new_child_dob: input.newChild?.dateOfBirth ?? undefined,
    p_copy_health_profile: input.copyHealthProfile ?? true,
  });

  if (error) {
    return { ok: false, code: mapRpcError(error.message) };
  }

  void data;
  return { ok: true, redirectTo: "/parent/today" };
}

export async function acceptCoachInvite(
  userId: string,
  token: string,
): Promise<AcceptInviteResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_coach_invite", {
    p_user_id: userId,
    p_token: token,
  });

  if (error) {
    return { ok: false, code: mapRpcError(error.message) };
  }

  return { ok: true, redirectTo: "/coach/programs" };
}
