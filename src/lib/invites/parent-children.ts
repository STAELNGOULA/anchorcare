import type { ParentChildOption } from "@/lib/invites/types";
import { createClient } from "@/lib/supabase/server";

export async function getParentChildren(userId: string): Promise<ParentChildOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select("id, first_name, last_name, date_of_birth, allergies, medications, medical_conditions")
    .eq("parent_id", userId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name ?? "",
    dateOfBirth: row.date_of_birth,
    allergies: row.allergies,
    medications: row.medications,
    medicalConditions: row.medical_conditions,
  }));
}
