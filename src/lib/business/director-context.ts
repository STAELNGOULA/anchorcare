import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type DashboardChecklistItem = {
  id: string;
  done: boolean;
  href: string;
};

export type DashboardAction = {
  id: string;
  href: string;
  tone: "default" | "accent";
};

export type DirectorContext = {
  userId: string;
  email: string;
  orgName: string;
  trialDaysLeft: number;
  trialActive: boolean;
  checklist: DashboardChecklistItem[];
  checklistComplete: boolean;
  actions: DashboardAction[];
  metrics: {
    familiesActivated: { value: string; pending: boolean };
    reportsThisWeek: { value: string; pending: boolean };
    openRate: { value: string; pending: boolean };
  };
};

const TRIAL_DAYS = 14;

function deriveOrgName(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    const first = fullName.trim().split(/\s+/)[0];
    return `${first}'s program`;
  }
  const local = email.split("@")[0] ?? "Program";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function getDirectorContext(): Promise<DirectorContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/business/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, full_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "business_admin") {
    redirect("/login");
  }

  if (profile.onboarding_status === "program_setup") {
    redirect("/business/onboarding");
  }

  const email = user.email ?? "";
  const createdAt = profile?.created_at
    ? new Date(profile.created_at)
    : new Date();
  const trialEnd = new Date(createdAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const trialActive = trialDaysLeft > 0;

  const hasProfile = Boolean(profile?.full_name?.trim());

  const checklist: DashboardChecklistItem[] = [
    { id: "profile", done: hasProfile, href: "/business/settings" },
    { id: "program", done: false, href: "/business/programs" },
    { id: "invite", done: false, href: "/business/families" },
    { id: "report", done: false, href: "/coach/programs" },
    { id: "activation", done: false, href: "/business/families" },
  ];

  const checklistComplete = checklist.every((item) => item.done);

  const actions: DashboardAction[] = [];
  if (!hasProfile) {
    actions.push({
      id: "complete-profile",
      href: "/business/settings",
      tone: "accent",
    });
  } else {
    actions.push({
      id: "create-program",
      href: "/business/programs",
      tone: "accent",
    });
    actions.push({
      id: "invite-families",
      href: "/business/families",
      tone: "default",
    });
  }

  const pending = true;

  return {
    userId: user.id,
    email,
    orgName: deriveOrgName(profile?.full_name ?? null, email),
    trialDaysLeft,
    trialActive,
    checklist,
    checklistComplete,
    actions,
    metrics: {
      familiesActivated: { value: "—", pending },
      reportsThisWeek: { value: "—", pending },
      openRate: { value: "—", pending },
    },
  };
}
