import { z } from "zod";

const phoneRegex = /^[\d\s()+\-.]{7,20}$/;

export const allergyItemSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(120),
  severity: z.enum(["mild", "moderate", "severe"]),
});

export const medicationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "nameRequired").max(120),
  dose: z.string().trim().max(120).optional().default(""),
  schedule: z.string().trim().max(200).optional().default(""),
});

export const emergencyContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "nameRequired").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "phoneInvalid")
    .max(20)
    .regex(phoneRegex, "phoneInvalid"),
  relation: z.string().trim().min(1, "relationRequired").max(80),
});

export const childCreateSchema = z.object({
  firstName: z.string().trim().min(1, "firstNameRequired").max(80),
  lastName: z.string().trim().min(1, "lastNameRequired").max(80),
  dateOfBirth: z.string().date("dobRequired"),
  allergies: z.string().trim().max(2000).optional().nullable(),
  allergyItems: z.array(allergyItemSchema).max(20).optional().default([]),
  medicalConditions: z.string().trim().max(2000).optional().nullable(),
  physicianName: z.string().trim().max(120).optional().nullable(),
  physicianPhone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || v === undefined || phoneRegex.test(v), "phoneInvalid"),
  insuranceInfo: z.string().trim().max(2000).optional().nullable(),
  medications: z.array(medicationSchema).max(20).optional().default([]),
  emergencyContacts: z.array(emergencyContactSchema).max(5).optional().default([]),
  copyFromChildId: z.string().uuid().optional(),
});

export const childUpdateSchema = childCreateSchema.partial().extend({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  dateOfBirth: z.string().date().optional(),
});

export type ChildCreateInput = z.infer<typeof childCreateSchema>;
export type ChildUpdateInput = z.infer<typeof childUpdateSchema>;
