import { createParentInvite } from "@/lib/invites/invite-service";
import { archiveProgram, getProgramForDirector } from "@/lib/business/program-service";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { slugifyOrgName } from "@/lib/business/slug";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function rolloverProgramSeason(
  userId: string,
  programId: string,
  newSeasonName: string,
): Promise<
  | { ok: true; newProgramId: string; invitesSent: number }
  | { ok: false; code: string }
> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId) return { ok: false, code: "forbidden" };

  const source = await getProgramForDirector(userId, programId);
  if (!source) return { ok: false, code: "notFound" };

  const archiveResult = await archiveProgram(userId, programId);
  if (!archiveResult.ok) return archiveResult;

  const service = createServiceClient();
  const baseSlug = slugifyOrgName(newSeasonName);
  let programSlug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: existing } = await service
      .from("programs")
      .select("id")
      .eq("org_id", orgId)
      .eq("program_slug", programSlug)
      .maybeSingle();
    if (!existing) break;
    programSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  const { data: newProgram, error } = await service
    .from("programs")
    .insert({
      org_id: orgId,
      name: newSeasonName.trim(),
      program_slug: programSlug,
      program_type: source.programType,
      age_min: source.ageMin,
      age_max: source.ageMax,
      capacity: source.capacity,
      status: "active",
      internal_description: source.internalDescription,
      price_amount_cents: source.priceAmountCents,
      currency: source.currency,
      billing_interval: source.billingInterval,
      deposit_amount_cents: source.depositAmountCents,
      sibling_discount_percent: source.siblingDiscountPercent,
      price_display: source.priceDisplay,
      price_note: source.priceNote,
      require_payment_before_approval: source.requirePaymentBeforeApproval,
      public_listing_enabled: source.publicListingEnabled,
      public_headline: newSeasonName.trim(),
      public_description: source.publicDescription,
      hero_image_url: source.heroImageUrl,
      age_range_label: source.ageRangeLabel,
      schedule_summary: source.scheduleSummary,
      waitlist_enabled: source.waitlistEnabled,
      featured_on_page: source.featuredOnPage,
      cta_label: source.ctaLabel,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !newProgram) return { ok: false, code: "cloneFailed" };

  const { data: registrations } = await service
    .from("program_registrations")
    .select("parent_id, children(first_name)")
    .eq("program_id", programId)
    .eq("status", "active");

  let invitesSent = 0;
  const parentEmails = new Map<string, string | undefined>();

  for (const reg of registrations ?? []) {
    const parentId = reg.parent_id as string;
    if (parentEmails.has(parentId)) continue;
    const child = reg.children as { first_name: string } | null;
    const { data: authData } = await service.auth.admin.getUserById(parentId);
    parentEmails.set(parentId, authData?.user?.email ?? undefined);
    void child;
  }

  for (const [parentId, email] of parentEmails) {
    if (!email) continue;
    const child = (registrations ?? []).find((r) => r.parent_id === parentId);
    const childFirst = (child?.children as { first_name: string } | null)?.first_name;
    try {
      await createParentInvite({
        orgId,
        programId: newProgram.id,
        email,
        childFirstName: childFirst,
        expiresInDays: 30,
      });
      invitesSent += 1;
    } catch {
      // skip failed invite
    }
    void parentId;
  }

  await service.from("program_season_rollovers").insert({
    org_id: orgId,
    source_program_id: programId,
    new_program_id: newProgram.id,
    invites_sent: invitesSent,
    created_by: userId,
    created_at: now,
  });

  return { ok: true, newProgramId: newProgram.id, invitesSent };
}
