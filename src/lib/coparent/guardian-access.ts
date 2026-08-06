import { createServiceClient } from "@/lib/supabase/service";
import { childGuardiansTable } from "@/lib/coparent/table-utils";

export async function isGuardianForChild(
  userId: string,
  childId: string,
): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await childGuardiansTable(service)
    .select("id")
    .eq("child_id", childId)
    .eq("guardian_user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getGuardianChildIds(userId: string): Promise<string[]> {
  const service = createServiceClient();
  const { data } = await childGuardiansTable(service)
    .select("child_id")
    .eq("guardian_user_id", userId);
  return (data ?? []).map((row: { child_id: string }) => row.child_id);
}

export async function canUserAccessChild(
  userId: string,
  childId: string,
): Promise<boolean> {
  const service = createServiceClient();
  const { data: owned } = await service
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", userId)
    .maybeSingle();
  if (owned) return true;
  return isGuardianForChild(userId, childId);
}
