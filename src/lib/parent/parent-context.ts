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

  return {
    userId: user.id,
    email,
    displayName,
    familyLabel: `${displayName}'s family`,
    plan: "free",
    childrenCount: 0,
    hasLinkedProgram: false,
  };
}
