"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { OnboardingStepper } from "@/components/business/onboarding/onboarding-stepper";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/business/page-header";
import { formatPriceDisplay } from "@/lib/business/program-pricing";
import {
  BILLING_INTERVAL_VALUES,
  CURRENCY_VALUES,
  PROGRAM_KIND_VALUES,
  type BillingInterval,
  type ProgramCurrency,
  type ProgramKind,
} from "@/lib/business/program-types";
import { Button } from "@/components/ui/button";

type WizardState = {
  name: string;
  programType: ProgramKind;
  ageMin: string;
  ageMax: string;
  startDate: string;
  endDate: string;
  capacity: string;
  internalDescription: string;
  priceAmount: string;
  currency: ProgramCurrency;
  billingInterval: BillingInterval;
  depositAmount: string;
  siblingDiscountPercent: string;
  priceNote: string;
  requirePaymentBeforeApproval: boolean;
};

const INITIAL: WizardState = {
  name: "",
  programType: "other",
  ageMin: "",
  ageMax: "",
  startDate: "",
  endDate: "",
  capacity: "",
  internalDescription: "",
  priceAmount: "0",
  currency: "USD",
  billingInterval: "season",
  depositAmount: "",
  siblingDiscountPercent: "",
  priceNote: "",
  requirePaymentBeforeApproval: true,
};

export function ProgramCreateWizard({
  defaultCurrency = "USD",
}: {
  defaultCurrency?: ProgramCurrency;
}) {
  const t = useTranslations("business.programs.wizard");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<WizardState>({ ...INITIAL, currency: defaultCurrency });

  const stepLabels = useMemo(
    () => [t("steps.basics"), t("steps.schedule"), t("steps.pricing")],
    [t],
  );

  const pricePreview = useMemo(() => {
    const cents = Math.round(Number(form.priceAmount || "0") * 100);
    return formatPriceDisplay({
      amountCents: Number.isFinite(cents) ? cents : 0,
      currency: form.currency,
      billingInterval: form.billingInterval,
    });
  }, [form.priceAmount, form.currency, form.billingInterval]);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setPending(true);
    try {
      const priceCents = Math.round(Number(form.priceAmount || "0") * 100);
      const res = await fetch("/api/business/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          programType: form.programType,
          ageMin: form.ageMin ? Number(form.ageMin) : null,
          ageMax: form.ageMax ? Number(form.ageMax) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          capacity: form.capacity ? Number(form.capacity) : null,
          internalDescription: form.internalDescription || undefined,
          priceAmountCents: Number.isFinite(priceCents) ? priceCents : 0,
          currency: form.currency,
          billingInterval: form.billingInterval,
          depositAmountCents: form.depositAmount
            ? Math.round(Number(form.depositAmount) * 100)
            : null,
          siblingDiscountPercent: form.siblingDiscountPercent
            ? Number(form.siblingDiscountPercent)
            : null,
          priceNote: form.priceNote || null,
          requirePaymentBeforeApproval: form.requirePaymentBeforeApproval,
          publicListingEnabled: false,
          status: "draft",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        program?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.program) {
        const errorKey = data.error ?? "saveFailed";
        const knownErrors = [
          "saveFailed",
          "validationError",
          "slugTaken",
        ] as const;
        toast.error(
          knownErrors.includes(errorKey as (typeof knownErrors)[number])
            ? t(`errors.${errorKey as (typeof knownErrors)[number]}`)
            : t("errors.saveFailed"),
        );
        return;
      }
      router.push(`/business/programs/${data.program.id}`);
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <OnboardingStepper currentStep={step} totalSteps={3} labels={stepLabels} />

      <div className="space-y-5 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
        {step === 1 ? (
          <>
            <TextField
              id="name"
              label={t("fields.name")}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FormSelectField
              id="programType"
              label={t("fields.type")}
              value={form.programType}
              onValueChange={(v) => update("programType", v as ProgramKind)}
              options={PROGRAM_KIND_VALUES.map((value) => ({
                value,
                label: t(`programType.${value}`),
              }))}
            />
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("fields.internalDescription")}</span>
              <textarea
                value={form.internalDescription}
                onChange={(e) => update("internalDescription", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="ageMin"
                label={t("fields.ageMin")}
                type="number"
                value={form.ageMin}
                onChange={(e) => update("ageMin", e.target.value)}
              />
              <TextField
                id="ageMax"
                label={t("fields.ageMax")}
                type="number"
                value={form.ageMax}
                onChange={(e) => update("ageMax", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="startDate"
                label={t("fields.startDate")}
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
              <TextField
                id="endDate"
                label={t("fields.endDate")}
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>
            <TextField
              id="capacity"
              label={t("fields.capacity")}
              type="number"
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <TextField
              id="priceAmount"
              label={t("fields.price")}
              type="number"
              min="0"
              step="0.01"
              value={form.priceAmount}
              onChange={(e) => update("priceAmount", e.target.value)}
              hint={t("fields.priceHint")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelectField
                id="currency"
                label={t("fields.currency")}
                value={form.currency}
                onValueChange={(v) => update("currency", v as ProgramCurrency)}
                options={CURRENCY_VALUES.map((value) => ({ value, label: value }))}
              />
              <FormSelectField
                id="billingInterval"
                label={t("fields.billingInterval")}
                value={form.billingInterval}
                onValueChange={(v) => update("billingInterval", v as BillingInterval)}
                options={BILLING_INTERVAL_VALUES.map((value) => ({
                  value,
                  label: t(`billingInterval.${value}`),
                }))}
              />
            </div>
            <p className="rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
              {t("fields.pricePreview", { price: pricePreview })}
            </p>
            <TextField
              id="deposit"
              label={t("fields.deposit")}
              type="number"
              min="0"
              step="0.01"
              value={form.depositAmount}
              onChange={(e) => update("depositAmount", e.target.value)}
            />
            <TextField
              id="siblingDiscount"
              label={t("fields.siblingDiscount")}
              type="number"
              min="0"
              max="100"
              value={form.siblingDiscountPercent}
              onChange={(e) => update("siblingDiscountPercent", e.target.value)}
            />
            <TextField
              id="priceNote"
              label={t("fields.priceNote")}
              value={form.priceNote}
              onChange={(e) => update("priceNote", e.target.value)}
            />
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.requirePaymentBeforeApproval}
                onChange={(e) => update("requirePaymentBeforeApproval", e.target.checked)}
              />
              <span>{t("fields.requirePayment")}</span>
            </label>
          </>
        ) : null}

        <div className="flex justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={step === 1 || pending}
            onClick={() => setStep((s) => s - 1)}
          >
            {t("back")}
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !form.name.trim()}
            >
              {t("continue")}
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-full"
              disabled={pending || !form.name.trim()}
              onClick={() => void submit()}
            >
              {pending ? t("creating") : t("create")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
