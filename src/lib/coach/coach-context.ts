import { createClient } from "@/lib/supabase/server";
import { countCoachPrograms } from "@/lib/coach/program-service";
import type { UserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export type CoachContext = {
  userId: string;
  email: string;
  displayName: string;
  workspaceLabel: string;
  role: Extract<UserRole, "coach" | "business_admin">;
  isDirectorMode: boolean;
  programsCount: number;
};

function deriveDisplayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "Coach";
  }
  const local = email.split("@")[0] ?? "Coach";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function getCoachContext(): Promise<CoachContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/coach/programs");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role !== "coach" && role !== "business_admin") {
    redirect("/login");
  }

  const email = user.email ?? "";
  const displayName = deriveDisplayName(profile?.full_name ?? null, email);

  const programsCount =
    role === "coach" ? await countCoachPrograms(user.id) : 0;

  return {
    userId: user.id,
    email,
    displayName,
    workspaceLabel:
      role === "business_admin"
        ? `${displayName}'s coaching`
        : `${displayName}'s programs`,
    role,
    isDirectorMode: role === "business_admin",
    programsCount,
  };
}
