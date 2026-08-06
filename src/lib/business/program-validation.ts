import { z } from "zod";
import {
  BILLING_INTERVAL_VALUES,
  CURRENCY_VALUES,
  PROGRAM_KIND_VALUES,
  PROGRAM_STATUS_VALUES,
} from "@/lib/business/program-types";
import { isValidPublicSlug } from "@/lib/business/slug";

const slugField = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .refine(isValidPublicSlug, { message: "slugInvalid" });

export const programCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  programSlug: slugField.optional(),
  programType: z.enum(PROGRAM_KIND_VALUES).default("other"),
  ageMin: z.number().int().min(0).max(18).nullable().optional(),
  ageMax: z.number().int().min(0).max(18).nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  endDate: z.string().date().nullable().optional(),
  capacity: z.number().int().min(1).max(5000).nullable().optional(),
  internalDescription: z.string().max(4000).optional(),
  priceAmountCents: z.number().int().min(0),
  currency: z.enum(CURRENCY_VALUES),
  billingInterval: z.enum(BILLING_INTERVAL_VALUES),
  depositAmountCents: z.number().int().min(0).nullable().optional(),
  siblingDiscountPercent: z.number().int().min(0).max(100).nullable().optional(),
  priceDisplay: z.string().max(80).nullable().optional(),
  priceNote: z.string().max(200).nullable().optional(),
  requirePaymentBeforeApproval: z.boolean().optional(),
  publicListingEnabled: z.boolean().optional(),
  publicHeadline: z.string().trim().max(120).nullable().optional(),
  publicDescription: z.string().max(4000).nullable().optional(),
  heroImageUrl: z.string().url().nullable().optional(),
  ageRangeLabel: z.string().max(80).nullable().optional(),
  scheduleSummary: z.string().max(200).nullable().optional(),
  registrationOpensAt: z.string().datetime().nullable().optional(),
  registrationClosesAt: z.string().datetime().nullable().optional(),
  waitlistEnabled: z.boolean().optional(),
  featuredOnPage: z.boolean().optional(),
  ctaLabel: z.string().trim().min(2).max(40).optional(),
  status: z.enum(PROGRAM_STATUS_VALUES).optional(),
});

export const programPatchSchema = programCreateSchema
  .partial()
  .extend({
    name: z.string().trim().min(2).max(120).optional(),
    programSlug: slugField.optional(),
  })
  .refine(
    (data) => {
      if (data.ageMin == null || data.ageMax == null) return true;
      return data.ageMin <= data.ageMax;
    },
    { message: "ageRangeInvalid", path: ["ageMax"] },
  );

export type ProgramCreateInput = z.infer<typeof programCreateSchema>;
export type ProgramPatchInput = z.infer<typeof programPatchSchema>;

export function canEnablePublicListing(input: {
  priceAmountCents: number;
  stripeConnectOnboarded: boolean;
  publicHeadline: string | null;
  scheduleSummary: string | null;
}): { ok: boolean; reason?: "connectRequired" | "headlineRequired" | "scheduleRequired" } {
  if (!input.publicHeadline?.trim()) {
    return { ok: false, reason: "headlineRequired" };
  }
  if (!input.scheduleSummary?.trim()) {
    return { ok: false, reason: "scheduleRequired" };
  }
  if (input.priceAmountCents > 0 && !input.stripeConnectOnboarded) {
    return { ok: false, reason: "connectRequired" };
  }
  return { ok: true };
}
