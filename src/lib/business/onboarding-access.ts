import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { businessOnboardingComplete } from "@/lib/business/onboarding-state";

export type OnboardingPageContext = {
  userId: string;
  email: string;
  directorName: string;
};

export async function getOnboardingPageContext(): Promise<OnboardingPageContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/business/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_status, full_name, org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "business_admin") {
    redirect("/login");
  }

  if (businessOnboardingComplete(profile.org_id)) {
    redirect("/business/dashboard");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    directorName: profile?.full_name?.trim() ?? "",
  };
}
