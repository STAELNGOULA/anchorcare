"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParentChildOption } from "@/lib/invites/types";
import type { PublicProgramListing } from "@/lib/business/program-types";
import { EnrollmentHealthPreview } from "@/components/parent/children/enrollment-health-preview";
import { resolveSmartCta } from "@/lib/public/smart-cta";
import { cn } from "@/lib/utils";

type BookPayStepperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Pick<
    PublicProgramListing,
    | "id"
    | "programSlug"
    | "publicHeadline"
    | "priceDisplay"
    | "priceAmountCents"
    | "registrationOpen"
    | "spotsRemaining"
    | "waitlistEnabled"
    | "paymentsConfigured"
  >;
  orgSlug: string;
  orgName: string;
  accentColor: string;
  user: { id: string; email: string } | null;
  children: ParentChildOption[];
  returnPath: string;
};

type Step = "auth" | "child" | "waiver" | "payment";

export function BookPayStepper({
  open,
  onOpenChange,
  program,
  orgSlug,
  orgName,
  accentColor,
  user,
  children,
  returnPath,
}: BookPayStepperProps) {
  const t = useTranslations("public.bookPay");
  const tAuth = useTranslations("auth");
  const cta = resolveSmartCta(program);

  const initialStep: Step = user ? "child" : "auth";
  const [step, setStep] = useState<Step>(initialStep);
  const [mode, setMode] = useState<"select" | "new">(children.length ? "select" : "new");
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  const childOptions = useMemo(
    () =>
      children.map((child) => ({
        value: child.id,
        label: `${child.firstName}${child.lastName ? ` ${child.lastName}` : ""}`,
      })),
    [children],
  );

  const loginUrl = `/login?returnTo=${encodeURIComponent(returnPath)}&intent=parent`;
  const signupUrl = `/sign-up/parent?returnTo=${encodeURIComponent(returnPath)}`;

  const enroll = async () => {
    setPending(true);
    try {
      const payload =
        mode === "select"
          ? { programId: program.id, childId, waiverGuardianName: guardianName }
          : {
              programId: program.id,
              newChild: {
                firstName: newFirstName.trim(),
                lastName: newLastName.trim() || undefined,
                dateOfBirth: newDob || undefined,
              },
              waiverGuardianName: guardianName,
            };

      const res = await fetch("/api/public/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        registrationId?: string;
        requiresPayment?: boolean;
      };

      if (!res.ok || !data.ok || !data.registrationId) {
        toast.error(t(`errors.${data.error ?? "enrollFailed"}` as "errors.enrollFailed"));
        return;
      }

      setRegistrationId(data.registrationId);

      if (data.requiresPayment) {
        setStep("payment");
        return;
      }

      toast.success(t("enrollSuccess"));
      onOpenChange(false);
      window.location.href = `${returnPath}?enrolled=1`;
    } catch {
      toast.error(t("errors.enrollFailed"));
    } finally {
      setPending(false);
    }
  };

  const startCheckout = async () => {
    if (!registrationId) return;
    setPending(true);
    try {
      const res = await fetch("/api/public/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          registrationId,
          programId: program.id,
          orgSlug,
          programSlug: program.programSlug,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        checkoutUrl?: string;
      };

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

  const selectedChild =
    mode === "select" ? children.find((c) => c.id === childId) ?? null : null;

  const stepTitle =
    step === "auth"
      ? t("steps.auth")
      : step === "child"
        ? t("steps.child")
        : step === "waiver"
          ? t("steps.waiver")
          : t("steps.payment");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{program.publicHeadline}</DialogTitle>
          <DialogDescription>
            {orgName} · {program.priceDisplay}
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {stepTitle}
        </p>

        {step === "auth" && !user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("authPrompt")}</p>
            <div className="flex flex-col gap-2">
              <Button asChild className="rounded-full" style={{ backgroundColor: accentColor }}>
                <Link href={signupUrl}>{tAuth("signUp")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={loginUrl}>{tAuth("login")}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {step === "child" && user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("signedInAs", { email: user.email })}
            </p>
            {children.length > 0 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    mode === "select"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {t("existingChild")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    mode === "new"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {t("newChild")}
                </button>
              </div>
            ) : null}
            {mode === "select" ? (
              <FormSelectField
                id="childId"
                label={t("selectChild")}
                value={childId}
                onValueChange={setChildId}
                options={childOptions}
              />
            ) : (
              <>
                <TextField
                  id="firstName"
                  label={t("childFirstName")}
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <TextField
                  id="lastName"
                  label={t("childLastName")}
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
                <TextField
                  id="dob"
                  label={t("childDob")}
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                />
              </>
            )}
            <EnrollmentHealthPreview child={selectedChild} />
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={mode === "select" ? !childId : !newFirstName.trim()}
              onClick={() => setStep("waiver")}
            >
              {t("continue")}
            </Button>
          </div>
        ) : null}

        {step === "waiver" && user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("waiverBody")}</p>
            <TextField
              id="guardianName"
              label={t("guardianName")}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
            />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
              />
              <span>{t("waiverAccept")}</span>
            </label>
            <Button
              type="button"
              className="w-full rounded-full"
              style={{ backgroundColor: accentColor }}
              disabled={!guardianName.trim() || !waiverAccepted || pending}
              onClick={() => void enroll()}
            >
              {pending
                ? t("processing")
                : program.priceAmountCents > 0
                  ? t("continueToPayment")
                  : t("completeEnrollment")}
            </Button>
          </div>
        ) : null}

        {step === "payment" && user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("paymentBody")}</p>
            <Button
              type="button"
              className="w-full rounded-full"
              style={{ backgroundColor: accentColor }}
              disabled={pending}
              onClick={() => void startCheckout()}
            >
              {pending ? t("processing") : t("payNow", { price: program.priceDisplay })}
            </Button>
          </div>
        ) : null}

        {!cta.actionable && step !== "auth" ? (
          <p className="text-sm text-amber-800">{t(`cta.${cta.labelKey}`)}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
