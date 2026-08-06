import { z } from "zod";
import { isValidRegion, type CountryCode } from "@/lib/geo/regions";

const emailSchema = z
  .string()
  .trim()
  .min(1, "emailRequired")
  .max(254, "emailTooLong")
  .email("emailInvalid");

const passwordSchema = z
  .string()
  .min(8, "passwordMin")
  .regex(/[A-Za-z]/, "passwordLetter")
  .regex(/[0-9]/, "passwordNumber");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired"),
  rememberDevice: z.boolean().optional().default(false),
  redirect: z.string().optional(),
  returnTo: z.string().optional(),
  inviteToken: z.string().optional(),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "nameMin").max(80, "nameMax"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "passwordRequired"),
    intent: z.enum(["parent", "program"]),
    country: z.enum(["US", "CA"], { message: "countryRequired" }),
    region: z.string().trim().min(1, "regionRequired"),
    inviteToken: z.string().optional(),
    inviteCode: z.string().trim().optional(),
    signupSource: z.enum(["organic", "public_page", "invite"]).optional(),
    acceptTerms: z.literal("on", { message: "termsRequired" }),
    company: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => isValidRegion(data.country as CountryCode, data.region),
    { message: "regionInvalid", path: ["region"] },
  );

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "passwordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export const inviteCodeSchema = z.object({
  token: z.string().trim().min(8, "inviteInvalid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
