"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArchiveProgramDialog } from "@/components/business/programs/archive-program-dialog";
import { SeasonRolloverWizard } from "@/components/business/programs/season-rollover-wizard";
import { StripeConnectBanner } from "@/components/business/programs/stripe-connect-banner";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { TextField } from "@/components/forms/text-field";
import { PageHeader } from "@/components/business/page-header";
import { formatPriceDisplay } from "@/lib/business/program-pricing";
import {
  BILLING_INTERVAL_VALUES,
  CURRENCY_VALUES,
  PROGRAM_KIND_VALUES,
  type Program,
} from "@/lib/business/program-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "operations" | "pricing" | "listing" | "roster" | "registrations" | "coaches";

type ProgramDetailWorkspaceProps = {
  initialProgram: Program;
  orgPublicSlug: string;
};

export function ProgramDetailWorkspace({
  initialProgram,
  orgPublicSlug,
}: ProgramDetailWorkspaceProps) {
  const t = useTranslations("business.programs.detail");
  const router = useRouter();
  const [program, setProgram] = useState(initialProgram);
  const [tab, setTab] = useState<Tab>("operations");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs: Tab[] = ["operations", "pricing", "listing", "roster", "registrations", "coaches"];

  const pricePreview = useMemo(
    () =>
      formatPriceDisplay({
        amountCents: program.priceAmountCents,
        currency: program.currency,
        billingInterval: program.billingInterval,
        override: program.priceDisplay,
      }),
    [program],
  );

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setPending(true);
      try {
        const res = await fetch(`/api/business/programs/${program.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(patch),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          program?: Program;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.program) {
          toast.error(t(`errors.${data.error ?? "saveFailed"}` as "errors.saveFailed"));
          return;
        }
        setProgram(data.program);
        toast.success(t("saved"));
      } catch {
        toast.error(t("errors.saveFailed"));
      } finally {
        setPending(false);
      }
    },
    [program.id, t],
  );

  const scheduleSave = (patch: Record<string, unknown>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(patch), 2000);
  };

  const updateField = (patch: Record<string, unknown>) => {
    setProgram((prev) => ({ ...prev, ...patch }) as Program);
    scheduleSave(patch);
  };

  const publicProgramUrl = `/p/${orgPublicSlug}/programs/${program.programSlug}`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/business/programs"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader title={program.name} subtitle={pricePreview} />
          <div className="flex gap-2">
            {pending ? (
              <span className="text-xs text-muted-foreground">{t("saving")}</span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setArchiveOpen(true)}
            >
              {t("archive")}
            </Button>
          </div>
        </div>
      </div>

      {program.priceAmountCents > 0 && !program.stripeConnectOnboarded ? (
        <StripeConnectBanner />
      ) : null}

      <div className="flex gap-2 overflow-x-auto rounded-full bg-secondary/60 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-[220ms] ease-out",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="space-y-5 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8">
        {tab === "operations" ? (
          <>
            <TextField
              id="name"
              label={t("fields.name")}
              value={program.name}
              onChange={(e) => updateField({ name: e.target.value })}
            />
            <FormSelectField
              id="programType"
              label={t("fields.type")}
              value={program.programType}
              onValueChange={(v) => updateField({ programType: v })}
              options={PROGRAM_KIND_VALUES.map((value) => ({
                value,
                label: t(`programType.${value}`),
              }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="startDate"
                label={t("fields.startDate")}
                type="date"
                value={program.startDate ?? ""}
                onChange={(e) => updateField({ startDate: e.target.value || null })}
              />
              <TextField
                id="endDate"
                label={t("fields.endDate")}
                type="date"
                value={program.endDate ?? ""}
                onChange={(e) => updateField({ endDate: e.target.value || null })}
              />
            </div>
            <TextField
              id="capacity"
              label={t("fields.capacity")}
              type="number"
              value={program.capacity?.toString() ?? ""}
              onChange={(e) =>
                updateField({ capacity: e.target.value ? Number(e.target.value) : null })
              }
            />
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("fields.internalDescription")}</span>
              <textarea
                value={program.internalDescription ?? ""}
                onChange={(e) =>
                  updateField({ internalDescription: e.target.value || null })
                }
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <FormSelectField
              id="status"
              label={t("fields.status")}
              value={program.status}
              onValueChange={(v) => updateField({ status: v })}
              options={[
                { value: "draft", label: t("status.draft") },
                { value: "active", label: t("status.active") },
                { value: "archived", label: t("status.archived") },
              ]}
            />
          </>
        ) : null}

        {tab === "pricing" ? (
          <>
            <TextField
              id="price"
              label={t("fields.price")}
              type="number"
              min="0"
              step="0.01"
              value={(program.priceAmountCents / 100).toString()}
              onChange={(e) =>
                updateField({
                  priceAmountCents: Math.round(Number(e.target.value || "0") * 100),
                })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelectField
                id="currency"
                label={t("fields.currency")}
                value={program.currency}
                onValueChange={(v) => updateField({ currency: v })}
                options={CURRENCY_VALUES.map((value) => ({ value, label: value }))}
              />
              <FormSelectField
                id="billingInterval"
                label={t("fields.billingInterval")}
                value={program.billingInterval}
                onValueChange={(v) => updateField({ billingInterval: v })}
                options={BILLING_INTERVAL_VALUES.map((value) => ({
                  value,
                  label: t(`billingInterval.${value}`),
                }))}
              />
            </div>
            <p className="rounded-xl bg-secondary/50 px-4 py-3 text-sm">{pricePreview}</p>
            <TextField
              id="priceNote"
              label={t("fields.priceNote")}
              value={program.priceNote ?? ""}
              onChange={(e) => updateField({ priceNote: e.target.value || null })}
            />
          </>
        ) : null}

        {tab === "listing" ? (
          <>
            <TextField
              id="publicHeadline"
              label={t("fields.publicHeadline")}
              value={program.publicHeadline ?? ""}
              onChange={(e) => updateField({ publicHeadline: e.target.value || null })}
            />
            <TextField
              id="scheduleSummary"
              label={t("fields.scheduleSummary")}
              value={program.scheduleSummary ?? ""}
              onChange={(e) => updateField({ scheduleSummary: e.target.value || null })}
            />
            <label className="block space-y-2 text-sm">
              <span className="font-medium">{t("fields.publicDescription")}</span>
              <textarea
                value={program.publicDescription ?? ""}
                onChange={(e) =>
                  updateField({ publicDescription: e.target.value || null })
                }
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={program.publicListingEnabled}
                onChange={(e) => updateField({ publicListingEnabled: e.target.checked })}
              />
              <span>{t("fields.publicListing")}</span>
            </label>
            <Button type="button" variant="outline" className="rounded-full" asChild>
              <Link href={publicProgramUrl} target="_blank" rel="noopener noreferrer">
                {t("previewListing")}
              </Link>
            </Button>
          </>
        ) : null}

        {tab === "roster" || tab === "registrations" || tab === "coaches" ? (
          <p className="text-sm text-muted-foreground">{t(`stubs.${tab}`)}</p>
        ) : null}
      </div>

      {program.status === "active" ? (
        <SeasonRolloverWizard programId={program.id} programName={program.name} />
      ) : null}

      <ArchiveProgramDialog
        open={archiveOpen}
        programName={program.name}
        onClose={() => setArchiveOpen(false)}
        onConfirm={async () => {
          const res = await fetch(`/api/business/programs/${program.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            router.push("/business/programs");
            return;
          }
          toast.error(t("errors.saveFailed"));
        }}
      />
    </div>
  );
}
