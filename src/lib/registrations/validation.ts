import { z } from "zod";

export const waiverSignSchema = z.object({
  guardianName: z.string().trim().min(2).max(120),
  signatureData: z.string().min(20),
});

export const checkoutSchema = z.object({
  registrationId: z.string().uuid(),
  programId: z.string().uuid(),
  orgSlug: z.string().min(1),
  programSlug: z.string().min(1),
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
  promoCode: z.string().trim().max(40).optional(),
  paymentPlan: z.enum(["full", "installment"]).optional(),
});

export const promoValidateSchema = z.object({
  registrationId: z.string().uuid(),
  programId: z.string().uuid(),
  promoCode: z.string().trim().min(1).max(40),
});

export const refundSchema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(500).optional(),
});

export const rejectRegistrationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
