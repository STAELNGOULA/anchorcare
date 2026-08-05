import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "emailRequired")
  .email("emailInvalid");

const passwordSchema = z
  .string()
  .min(8, "passwordMin")
  .regex(/[A-Za-z]/, "passwordLetter")
  .regex(/[0-9]/, "passwordNumber");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired"),
  redirect: z.string().optional(),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, "nameRequired").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "passwordRequired"),
    intent: z.enum(["parent", "program"]),
    inviteToken: z.string().optional(),
    acceptTerms: z.literal("on", { message: "termsRequired" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

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
