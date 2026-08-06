"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { SignaturePad } from "@/components/forms/signature-pad";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EnrollContext = {
  registrationId: string;
  programId: string;
  programName: string;
  orgName: string;
  orgSlug: string;
  programSlug: string;
  childName: string;
  priceDisplay: string | null;
  amountDueCents: number;
  needsWaiver: boolean;
  needsPayment: boolean;
  waiverSigned: boolean;
};

type ParentEnrollStepperProps = {
  context: EnrollContext;
};

type Step = "waiver" | "payment" | "done";

export function ParentEnrollStepper({ context }: ParentEnrollStepperProps) {
  const t = useTranslations("parent.programs.enroll");
  const router = useRouter();
  const initialStep: Step = context.needsWaiver
    ? "waiver"
    : context.needsPayment
      ? "payment"
      : "done";
  const [step, setStep] = useState<Step>(initialStep);
  const [guardianName, setGuardianName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "installment">("full");
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);

  const steps: Step[] = ["waiver", "payment", "done"];
  const stepIndex = steps.indexOf(step);

  const signWaiver = async () => {
    if (!guardianName.trim() || !signature) return;
    setPending(true);
    try {
      const res = await fetch(`/api/parent/registrations/${context.registrationId}/waiver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guardianName: guardianName.trim(),
          signatureData: signature,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(t(`errors.${data.error ?? "waiverFailed"}` as "errors.waiverFailed"));
        return;
      }
      toast.success(t("waiverSigned"));
      if (context.needsPayment) {
        setStep("payment");
      } else {
        setStep("done");
      }
    } catch {
      toast.error(t("errors.waiverFailed"));
    } finally {
      setPending(false);
    }
  };

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/registrations/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          registrationId: context.registrationId,
          programId: context.programId,
          promoCode: promoCode.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; discountCents?: number; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(t(`errors.${data.error ?? "invalidPromo"}` as "errors.invalidPromo"));
        setPromoDiscount(null);
        return;
      }
      setPromoDiscount(data.discountCents ?? 0);
      toast.success(t("promoApplied"));
    } catch {
      toast.error(t("errors.invalidPromo"));
    } finally {
      setPending(false);
    }
  };

  const checkout = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/registrations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          registrationId: context.registrationId,
          programId: context.programId,
          orgSlug: context.orgSlug,
          programSlug: context.programSlug,
          promoCode: promoCode.trim() || undefined,
          paymentPlan,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; checkoutUrl?: string; error?: string };
      if (!res.ok || !data.ok || !data.checkoutUrl) {
        toast.error(t(`errors.${data.error ?? "checkoutFailed"}` as "errors.checkoutFailed"));
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error(t("errors.checkoutFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <nav aria-label={t("stepperLabel")} className="flex items-center gap-2">
        {steps.slice(0, 2).map((key, index) => (
          <div key={key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300",
                stepIndex >= index
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t(`steps.${key}`)}
            </span>
            {index < 1 ? <div className="h-px flex-1 bg-border/60" /> : null}
          </div>
        ))}
      </nav>

      <BezelCard className="space-y-5 p-6">
        <div>
          <p className="font-display text-2xl text-foreground">{context.programName}</p>
          <p className="text-sm text-muted-foreground">
            {context.orgName} · {context.childName}
          </p>
        </div>

        {step === "waiver" ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("waiverBody")}</p>
            <TextField
              id="guardianName"
              label={t("guardianName")}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
            />
            <SignaturePad
              id="signature"
              label={t("signature")}
              onChange={setSignature}
              hint={t("signatureHint")}
            />
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={pending || !guardianName.trim() || !signature}
              onClick={() => void signWaiver()}
            >
              {pending ? t("processing") : t("signAndContinue")}
            </Button>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("paymentBody")}</p>
            <p className="font-display text-xl text-foreground">
              {context.priceDisplay ?? t("amountDue")}
            </p>
            {promoDiscount != null && promoDiscount > 0 ? (
              <p className="text-sm text-primary">
                {t("promoSavings", { amount: (promoDiscount / 100).toFixed(2) })}
              </p>
            ) : null}
            <div className="flex gap-2">
              <TextField
                id="promoCode"
                label={t("promoCode")}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                containerClassName="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-8 rounded-full"
                disabled={pending || !promoCode.trim()}
                onClick={() => void validatePromo()}
              >
                {t("applyPromo")}
              </Button>
            </div>
            <div className="flex gap-2">
              {(["full", "installment"] as const).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setPaymentPlan(plan)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors duration-200 ease-out",
                    paymentPlan === plan
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {t(`paymentPlan.${plan}`)}
                </button>
              ))}
            </div>
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={pending}
              onClick={() => void checkout()}
            >
              {pending ? t("processing") : t("payNow")}
            </Button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="space-y-4 text-center">
            <p className="font-display text-xl text-foreground">{t("doneTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("doneBody")}</p>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => router.push("/parent/programs/enrolled")}
            >
              {t("viewEnrolled")}
            </Button>
          </div>
        ) : null}
      </BezelCard>
    </div>
  );
}
