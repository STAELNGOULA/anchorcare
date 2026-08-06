import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const enrollSchema = z.object({
  programId: z.string().uuid(),
  childId: z.string().uuid().optional(),
  newChild: z
    .object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().max(80).optional(),
      dateOfBirth: z.string().date().optional(),
    })
    .optional(),
  waiverGuardianName: z.string().trim().min(2).max(120),
});

export type PublicEnrollInput = z.infer<typeof enrollSchema>;

function mapRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("unauthorized")) return "unauthorized";
  if (lower.includes("waiver_required")) return "waiverRequired";
  if (lower.includes("program_not_available")) return "programNotAvailable";
  if (lower.includes("registration_closed")) return "registrationClosed";
  if (lower.includes("program_full")) return "programFull";
  if (lower.includes("child_not_found")) return "childNotFound";
  if (lower.includes("child_required")) return "childRequired";
  return "enrollFailed";
}

export async function enrollPublicProgram(
  userId: string,
  input: PublicEnrollInput,
): Promise<
  | { ok: true; registrationId: string; requiresPayment: boolean }
  | { ok: false; code: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_public_registration", {
    p_user_id: userId,
    p_program_id: input.programId,
    p_child_id: input.childId ?? null,
    p_new_child_first_name: input.newChild?.firstName ?? null,
    p_new_child_last_name: input.newChild?.lastName ?? null,
    p_new_child_dob: input.newChild?.dateOfBirth ?? null,
    p_waiver_guardian_name: input.waiverGuardianName,
  } as never);

  if (error) {
    return { ok: false, code: mapRpcError(error.message) };
  }

  await attributePublicSignupSource(userId);

  const registrationId = data as string;

  const { data: program } = await supabase
    .from("programs")
    .select("price_amount_cents")
    .eq("id", input.programId)
    .maybeSingle();

  const requiresPayment = (program?.price_amount_cents ?? 0) > 0;

  return { ok: true, registrationId, requiresPayment };
}

export async function attributePublicSignupSource(userId: string): Promise<void> {
  const service = createServiceClient();
  await service
    .from("profiles")
    .update({ signup_source: "public_page", updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export { enrollSchema };
