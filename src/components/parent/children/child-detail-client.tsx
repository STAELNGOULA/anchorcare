"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AllergyTagInput } from "@/components/parent/children/allergy-tag-input";
import { ChildPhotoUpload } from "@/components/parent/children/child-photo-upload";
import { DeleteChildDialog } from "@/components/parent/children/delete-child-dialog";
import { EmergencyContactRows } from "@/components/parent/children/emergency-contact-rows";
import { HealthCompletenessBadge } from "@/components/parent/children/health-completeness-badge";
import { MedicationRows } from "@/components/parent/children/medication-rows";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { ChildProfile } from "@/lib/parent/child-types";
import { computeChildAge } from "@/lib/parent/child-utils";
import { cn } from "@/lib/utils";

type ChildDetailClientProps = {
  child: ChildProfile;
};

const TABS = ["profile", "health", "programs", "emergency"] as const;
type Tab = (typeof TABS)[number];

export function ChildDetailClient({ child: initial }: ChildDetailClientProps) {
  const t = useTranslations("parent.family.children");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "profile";

  const [child, setChild] = useState(initial);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setTab = (next: Tab) => {
    router.replace(`/parent/family/children/${child.id}?tab=${next}`, {
      scroll: false,
    });
  };

  const save = async (patch: Record<string, unknown>) => {
    setPending(true);
    try {
      const res = await fetch(`/api/parent/children/${child.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        child?: ChildProfile;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.child) {
        toast.error(t(`errors.${data.error ?? "saveFailed"}` as "errors.saveFailed"));
        return;
      }
      setChild(data.child);
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setPending(false);
    }
  };

  const fullName = `${child.firstName} ${child.lastName}`.trim();
  const age = computeChildAge(child.dateOfBirth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/parent/family/children"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("backToList")}
          </Link>
          <h2 className="mt-2 font-display text-2xl text-foreground md:text-3xl">
            {fullName}
          </h2>
          {age ? (
            <p className="text-sm text-muted-foreground">{t("age", { age })}</p>
          ) : null}
        </div>
        <HealthCompletenessBadge score={child.healthScore} />
      </div>

      <div
        className="flex gap-1 overflow-x-auto rounded-full bg-secondary p-1"
        role="tablist"
        aria-label={t("tabs.label")}
      >
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ease-out",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <BezelCard className="space-y-6 p-6 md:p-8">
          <ChildPhotoUpload
            childId={child.id}
            signedUrl={child.photoSignedUrl}
            onUploaded={(signedUrl) =>
              setChild((c) => ({ ...c, photoSignedUrl: signedUrl }))
            }
          />
          <TextField
            id="firstName"
            label={t("wizard.firstName")}
            defaultValue={child.firstName}
            onBlur={(e) => {
              if (e.target.value !== child.firstName) {
                void save({ firstName: e.target.value });
              }
            }}
          />
          <TextField
            id="lastName"
            label={t("wizard.lastName")}
            defaultValue={child.lastName}
            onBlur={(e) => {
              if (e.target.value !== child.lastName) {
                void save({ lastName: e.target.value });
              }
            }}
          />
          <TextField
            id="dob"
            label={t("wizard.dateOfBirth")}
            type="date"
            defaultValue={child.dateOfBirth ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (child.dateOfBirth ?? "")) {
                void save({ dateOfBirth: e.target.value });
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-full text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            {t("delete.action")}
          </Button>
        </BezelCard>
      ) : null}

      {tab === "health" ? (
        <BezelCard className="space-y-6 p-6 md:p-8">
          <AllergyTagInput
            items={child.allergyItems}
            onChange={(items) => setChild((c) => ({ ...c, allergyItems: items }))}
            notes={child.allergies ?? ""}
            onNotesChange={(allergies) => setChild((c) => ({ ...c, allergies }))}
          />
          <MedicationRows
            value={child.medications}
            onChange={(medications) => setChild((c) => ({ ...c, medications }))}
          />
          <TextField
            id="conditions"
            label={t("wizard.medicalConditions")}
            value={child.medicalConditions ?? ""}
            onChange={(e) =>
              setChild((c) => ({ ...c, medicalConditions: e.target.value }))
            }
          />
          <TextField
            id="physicianName"
            label={t("wizard.physicianName")}
            value={child.physicianName ?? ""}
            onChange={(e) =>
              setChild((c) => ({ ...c, physicianName: e.target.value }))
            }
          />
          <TextField
            id="physicianPhone"
            label={t("wizard.physicianPhone")}
            type="tel"
            value={child.physicianPhone ?? ""}
            onChange={(e) =>
              setChild((c) => ({ ...c, physicianPhone: e.target.value }))
            }
          />
          <Button
            type="button"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              void save({
                allergyItems: child.allergyItems,
                allergies: child.allergies,
                medications: child.medications,
                medicalConditions: child.medicalConditions,
                physicianName: child.physicianName,
                physicianPhone: child.physicianPhone,
              })
            }
          >
            {pending ? t("wizard.saving") : t("saveHealth")}
          </Button>
        </BezelCard>
      ) : null}

      {tab === "programs" ? (
        <BezelCard className="p-6 md:p-8">
          {child.programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("programs.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {child.programs.map((program) => (
                <li
                  key={program.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{program.programName}</p>
                    <p className="text-xs text-muted-foreground">{program.orgName}</p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`programs.status.${program.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </BezelCard>
      ) : null}

      {tab === "emergency" ? (
        <BezelCard className="space-y-6 p-6 md:p-8">
          <EmergencyContactRows
            value={child.emergencyContacts}
            onChange={(emergencyContacts) =>
              setChild((c) => ({ ...c, emergencyContacts }))
            }
          />
          <TextField
            id="insurance"
            label={t("wizard.insurance")}
            value={child.insuranceInfo ?? ""}
            onChange={(e) =>
              setChild((c) => ({ ...c, insuranceInfo: e.target.value }))
            }
            hint={t("wizard.insuranceHint")}
          />
          <Button
            type="button"
            className="rounded-full"
            disabled={pending}
            onClick={() =>
              void save({
                emergencyContacts: child.emergencyContacts,
                insuranceInfo: child.insuranceInfo,
              })
            }
          >
            {pending ? t("wizard.saving") : t("saveEmergency")}
          </Button>
        </BezelCard>
      ) : null}

      <DeleteChildDialog
        childId={child.id}
        childName={fullName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
