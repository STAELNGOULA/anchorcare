/** @deprecated Use @/lib/invites/invite-service */
export {
  getInviteDetailByToken as getInviteByToken,
  emailsMatch,
  isInviteExpired,
  isInviteUsed,
} from "@/lib/invites/invite-service";

export type { InviteDetail } from "@/lib/invites/types";

import { acceptCoachInvite, acceptParentInvite } from "@/lib/invites/accept-service";
import { getInviteDetailByToken } from "@/lib/invites/invite-service";

/** Legacy accept — prefer the invite page + API for parent flows with child selection. */
export async function acceptInviteForUser(
  token: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const invite = await getInviteDetailByToken(token);
  if (!invite) return { ok: false, code: "inviteNotFound" };

  if (invite.inviteType === "coach") {
    const result = await acceptCoachInvite(userId, token);
    return result.ok ? { ok: true } : { ok: false, code: result.code };
  }

  const result = await acceptParentInvite(userId, { token });
  return result.ok ? { ok: true } : { ok: false, code: result.code };
}

export function toInvitePreview(invite: {
  token: string;
  programName: string;
  childFirstName: string | null;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
}) {
  const now = Date.now();
  const expires = new Date(invite.expiresAt).getTime();
  return {
    token: invite.token,
    programName: invite.programName,
    childFirstName: invite.childFirstName,
    email: invite.email,
    expired: expires < now,
    used: Boolean(invite.usedAt),
  };
}
