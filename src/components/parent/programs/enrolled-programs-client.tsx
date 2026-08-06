"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PaymentReceiptModal } from "@/components/parent/programs/payment-receipt-modal";
import { Button } from "@/components/ui/button";
import type { ParentEnrolledProgram } from "@/lib/registrations/types";
import { cn } from "@/lib/utils";

type EnrolledProgramsClientProps = {
  programs: ParentEnrolledProgram[];
};

export function EnrolledProgramsClient({ programs }: EnrolledProgramsClientProps) {
  const t = useTranslations("parent.programs.enrolled");
  const searchParams = useSearchParams();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const enrolledFlag = searchParams.get("enrolled") === "1";
  const registrationId = searchParams.get("registrationId");

  useEffect(() => {
    if (enrolledFlag && registrationId) {
      setReceiptOpen(true);
    }
  }, [enrolledFlag, registrationId]);

  if (programs.length === 0) {
    return (
      <BezelCard className="space-y-4 p-8 text-center">
        <p className="font-display text-xl text-foreground">{t("emptyTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
      </BezelCard>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {programs.map((program) => {
          const needsAction = program.needsWaiver || program.needsPayment;
          const enrollHref = `/parent/programs/enroll/${program.registrationId}`;

          return (
            <BezelCard
              key={program.registrationId}
              className="flex flex-col gap-4 p-5 transition-[box-shadow,background-color] duration-300 hover:shadow-soft"
            >
              <div className="space-y-1">
                <p className="font-display text-xl text-foreground">{program.programName}</p>
                <p className="text-sm text-muted-foreground">{program.orgName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    program.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : program.status === "pending"
                        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`status.${program.status}`)}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {t(`payment.${program.paymentStatus}`)}
                </span>
              </div>
              {needsAction ? (
                <Button asChild className="mt-auto rounded-full">
                  <Link href={enrollHref}>
                    {program.needsWaiver ? t("completeWaiver") : t("completePayment")}
                  </Link>
                </Button>
              ) : (
                <p className="mt-auto text-xs text-muted-foreground">{t("allSet")}</p>
              )}
            </BezelCard>
          );
        })}
      </div>

      <PaymentReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        registrationId={registrationId}
      />
    </>
  );
}
