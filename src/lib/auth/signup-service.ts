import type { OnboardingStatus } from "@/lib/auth/onboarding";
import type { SignupSource } from "@/lib/auth/signup-source";
import type { UserRole } from "@/lib/auth/roles";
import { createServiceClient } from "@/lib/supabase/service";

type FinalizeSignupProfileInput = {
  userId: string;
  role: UserRole;
  fullName: string;
  country: "US" | "CA";
  region: string;
  signupSource: SignupSource;
  onboardingStatus: OnboardingStatus;
};

export async function finalizeSignupProfile(
  input: FinalizeSignupProfileInput,
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({
      role: input.role,
      full_name: input.fullName,
      country: input.country,
      region: input.region,
      signup_source: input.signupSource,
      terms_accepted_at: now,
      onboarding_status: input.onboardingStatus,
      updated_at: now,
    })
    .eq("id", input.userId);
}
