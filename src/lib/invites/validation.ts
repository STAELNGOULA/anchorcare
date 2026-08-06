import { z } from "zod";

export const acceptParentInviteSchema = z
  .object({
    childId: z.string().uuid().optional(),
    newChild: z
      .object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().max(80).optional(),
        dateOfBirth: z.string().optional(),
      })
      .optional(),
    copyHealthProfile: z.boolean().optional().default(true),
  })
  .refine((data) => Boolean(data.childId || data.newChild?.firstName), {
    message: "childRequired",
    path: ["childId"],
  });

export const createInviteSchema = z.object({
  programId: z.string().uuid(),
  email: z.string().email().optional(),
  childFirstName: z.string().trim().max(80).optional(),
});
