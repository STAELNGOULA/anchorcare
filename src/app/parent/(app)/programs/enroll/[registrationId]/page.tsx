import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ParentEnrollStepper } from "@/components/parent/programs/parent-enroll-stepper";
import { getRegistrationForParent } from "@/lib/registrations/registration-service";
import { getParentContext } from "@/lib/parent/parent-context";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ registrationId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.programs.enroll");
  return { title: t("metaTitle") };
}

export default async function ParentEnrollPage({ params }: PageProps) {
  const { registrationId } = await params;
  const context = await getParentContext();
  const registration = await getRegistrationForParent(context.userId, registrationId);

  if (!registration) notFound();

  const program = registration.programs;

  if (!program) notFound();

  const org = program.organizations;
  if (!org?.public_slug || !program.program_slug) {
    redirect("/parent/programs/enrolled");
  }

  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("first_name, last_name")
    .eq("id", registration.child_id)
    .maybeSingle();

  const priceCents = program.price_amount_cents ?? 0;
  const needsWaiver = !registration.waiver_accepted_at;
  const needsPayment = priceCents > 0 && registration.payment_status !== "paid";

  if (!needsWaiver && !needsPayment) {
    redirect("/parent/programs/enrolled");
  }

  return (
    <ParentEnrollStepper
      context={{
        registrationId: registration.id,
        programId: program.id,
        programName: program.name,
        orgName: org.name,
        orgSlug: org.public_slug,
        programSlug: program.program_slug,
        childName: `${child?.first_name ?? ""} ${child?.last_name ?? ""}`.trim(),
        priceDisplay: program.price_display,
        amountDueCents: priceCents,
        needsWaiver,
        needsPayment,
        waiverSigned: Boolean(registration.waiver_accepted_at),
      }}
    />
  );
}
