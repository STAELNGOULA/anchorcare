import type { BusinessOnboardingInput } from "@/lib/business/onboarding-validation";
import { resolveOnboardingAddress } from "@/lib/business/onboarding-validation";
import { suggestHeadline } from "@/lib/business/slug";
import { createClient } from "@/lib/supabase/server";

export type OnboardingResult =
  | { ok: true; orgId: string }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "orgExists"
        | "slugTaken"
        | "validationError"
        | "unknownError";
      fieldErrors?: Record<string, string>;
    };

export async function completeBusinessOnboarding(
  userId: string,
  input: BusinessOnboardingInput,
): Promise<OnboardingResult> {
  const supabase = await createClient();

  const programName =
    input.skipProgram || !input.programName?.trim()
      ? null
      : input.programName.trim();

  const programStartDate =
    programName && input.programStartDate ? input.programStartDate : null;

  const { country, region } = resolveOnboardingAddress(input);

  const { data, error } = await supabase.rpc("complete_business_onboarding", {
    p_user_id: userId,
    p_director_name: input.directorName,
    p_director_title: input.directorTitle,
    p_org_name: input.orgName,
    p_org_type: input.orgType,
    p_jurisdiction_country: input.jurisdictionCountry,
    p_jurisdiction_region: input.jurisdictionRegion,
    p_address_line1: input.addressLine1,
    p_city: input.city,
    p_region: region,
    p_postal_code: input.postalCode,
    p_country: country,
    p_public_slug: input.publicSlug,
    p_suggested_headline: suggestHeadline(input.orgName),
    p_program_name: programName ?? undefined,
    p_program_start_date: programStartDate ?? undefined,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("org_exists")) return { ok: false, code: "orgExists" };
    if (message.includes("slug_taken")) {
      return {
        ok: false,
        code: "slugTaken",
        fieldErrors: { publicSlug: "slugTaken" },
      };
    }
    if (message.includes("unauthorized")) {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "unknownError" };
  }

  return { ok: true, orgId: data as string };
}
