import { z } from "zod";
import { ORG_TYPE_VALUES } from "@/lib/business/org-types";
import { isValidPublicSlug } from "@/lib/business/slug";
import { isValidRegion, type CountryCode } from "@/lib/geo/regions";

const countrySchema = z.enum(["US", "CA"]);

export const businessOnboardingSchema = z
  .object({
    directorName: z.string().trim().min(2, "nameMin").max(80, "nameMax"),
    directorTitle: z.string().trim().min(2, "titleRequired").max(80, "titleMax"),
    orgName: z.string().trim().min(2, "orgNameRequired").max(120, "orgNameMax"),
    orgType: z.enum(ORG_TYPE_VALUES),
    jurisdictionCountry: countrySchema,
    jurisdictionRegion: z.string().trim().min(1, "regionRequired"),
    addressLine1: z.string().trim().min(3, "addressRequired").max(200),
    city: z.string().trim().min(2, "cityRequired").max(80),
    postalCode: z.string().trim().min(3, "postalRequired").max(20),
    publicSlug: z.string().trim().min(3, "slugMin").max(40, "slugMax"),
    skipProgram: z.boolean().optional().default(true),
    programName: z.string().trim().max(120).optional(),
    programStartDate: z.string().optional(),
  })
  .refine(
    (data) =>
      isValidRegion(data.jurisdictionCountry as CountryCode, data.jurisdictionRegion),
    { message: "regionInvalid", path: ["jurisdictionRegion"] },
  )
  .refine((data) => isValidPublicSlug(data.publicSlug), {
    message: "slugInvalid",
    path: ["publicSlug"],
  });

export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;

/** Address country/region mirror jurisdiction for storage. */
export function resolveOnboardingAddress(input: BusinessOnboardingInput) {
  return {
    country: input.jurisdictionCountry,
    region: input.jurisdictionRegion,
  };
}
