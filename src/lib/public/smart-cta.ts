import type { PublicProgramListing } from "@/lib/business/program-types";
import {
  computeSpotsRemaining,
  isRegistrationWindowOpen,
} from "@/lib/business/program-public";
import { isPaidProgram } from "@/lib/business/program-pricing";

export type SmartCtaKind =
  | "book_pay"
  | "free_enroll"
  | "waitlist"
  | "closed"
  | "payments_unavailable";

export type SmartCta = {
  kind: SmartCtaKind;
  labelKey: SmartCtaKind;
  actionable: boolean;
};

export function resolveSmartCta(program: {
  priceAmountCents: number;
  registrationOpen: boolean;
  spotsRemaining: number | null;
  waitlistEnabled: boolean;
  paymentsConfigured: boolean;
}): SmartCta {
  if (!program.registrationOpen) {
    return { kind: "closed", labelKey: "closed", actionable: false };
  }

  if (
    isPaidProgram(program.priceAmountCents) &&
    !program.paymentsConfigured
  ) {
    return {
      kind: "payments_unavailable",
      labelKey: "payments_unavailable",
      actionable: false,
    };
  }

  if (program.spotsRemaining === 0) {
    if (program.waitlistEnabled) {
      return { kind: "waitlist", labelKey: "waitlist", actionable: true };
    }
    return { kind: "closed", labelKey: "closed", actionable: false };
  }

  if (!isPaidProgram(program.priceAmountCents)) {
    return { kind: "free_enroll", labelKey: "free_enroll", actionable: true };
  }

  return { kind: "book_pay", labelKey: "book_pay", actionable: true };
}

export function formatSpotsLabel(
  program: Pick<PublicProgramListing, "spotsRemaining" | "waitlistEnabled">,
  t: (key: "spotsLeft" | "waitlistOpen" | "full", values?: { count: number }) => string,
): string | null {
  if (program.spotsRemaining == null) return null;
  if (program.spotsRemaining === 0) {
    return program.waitlistEnabled ? t("waitlistOpen") : t("full");
  }
  return t("spotsLeft", { count: program.spotsRemaining });
}
