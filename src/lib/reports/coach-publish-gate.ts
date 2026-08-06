import { assertCoachProgramAccess } from "@/lib/reports/voice-report-service";
import { isCoachActiveInOrg } from "@/lib/business/team-service";
import { createClient } from "@/lib/supabase/server";

export async function assertCoachCanPublish(
  userId: string,
  programId: string,
): Promise<
  | { ok: true; orgId: string; programName: string }
  | { ok: false; error: string; code?: string }
> {
  const access = await assertCoachProgramAccess(userId, programId);
  if (!access.ok) {
    return { ok: false, error: access.error, code: "forbidden" };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "coach") {
    return access;
  }

  const active = await isCoachActiveInOrg(userId, access.orgId);
  if (!active) {
    return {
      ok: false,
      error: "Coach access has been revoked",
      code: "coach_deactivated",
    };
  }

  const { data: assignment } = await supabase
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .maybeSingle();

  if (!assignment) {
    return {
      ok: false,
      error: "You are not assigned to this program",
      code: "coach_unassigned",
    };
  }

  return access;
}
