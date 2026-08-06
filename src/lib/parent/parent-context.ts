import { resolveParentPlan } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export type ParentPlan = "free" | "family";

export type ParentContext = {
  userId: string;
  email: string;
  displayName: string;
  familyLabel: string;
  plan: ParentPlan;
  childrenCount: number;
  hasLinkedProgram: boolean;
};

function deriveDisplayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "Parent";
  }
  const local = email.split("@")[0] ?? "Parent";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function getParentContext(): Promise<ParentContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/parent/today");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "parent") {
    redirect("/login");
  }

  if (profile.onboarding_status === "pending_link") {
    redirect("/connect");
  }

  const email = user.email ?? "";
  const displayName = deriveDisplayName(profile?.full_name ?? null, email);

  const { count: childrenCount } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id);

  const { count: registrationCount } = await supabase
    .from("program_registrations")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id);

  const plan = await resolveParentPlan(user.id);

  return {
    userId: user.id,
    email,
    displayName,
    familyLabel: `${displayName}'s family`,
    plan,
    childrenCount: childrenCount ?? 0,
    hasLinkedProgram: (registrationCount ?? 0) > 0,
  };
}
