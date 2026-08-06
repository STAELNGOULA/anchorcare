"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AllergyTagInput } from "@/components/parent/children/allergy-tag-input";
import { EmergencyContactRows } from "@/components/parent/children/emergency-contact-rows";
import { MedicationRows } from "@/components/parent/children/medication-rows";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { ParentEmergencyChild } from "@/lib/emergency/types";
import type { AllergyItem, ChildMedication, EmergencyContact } from "@/lib/parent/child-types";
import { cn } from "@/lib/utils";

type ParentEmergencyWorkspaceProps = {
  children: ParentEmergencyChild[];
};

type Section = "allergies" | "meds" | "conditions" | "contacts" | "sharing";

const SECTIONS: Section[] = [
  "allergies",
  "meds",
  "conditions",
  "contacts",
  "sharing",
];

export function ParentEmergencyWorkspace({
  children: initialChildren,
}: ParentEmergencyWorkspaceProps) {
  const t = useTranslations("parent.family.emergency");
  const router = useRouter();
  const [children, setChildren] = useState(initialChildren);
  const [selectedId, setSelectedId] = useState(initialChildren[0]?.childId ?? "");
  const [section, setSection] = useState<Section>("allergies");
  const [pending, setPending] = useState(false);

  const child = children.find((c) => c.childId === selectedId) ?? null;

  if (children.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actionHref="/parent/family/children"
        actionLabel={t("emptyCta")}
      />
    );
  }

  const saveHealth = async (patch: Record<string, unknown>) => {
    if (!child) return;
    setPending(true);
    try {
      const res = await fetch(`/api/parent/children/${child.childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { ok?: boolean; child?: { allergyItems?: AllergyItem[]; allergies?: string | null; medications?: ChildMedication[]; medicalConditions?: string | null; emergencyContacts?: EmergencyContact[]; physicianName?: string | null; physicianPhone?: string | null } };
      if (!res.ok || !data.ok || !data.child) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      setChildren((prev) =>
        prev.map((c) =>
          c.childId === child.childId
            ? {
                ...c,
                allergies: data.child!.allergies ?? c.allergies,
                allergyItems: data.child!.allergyItems ?? c.allergyItems,
                medications: data.child!.medications ?? c.medications,
                medicalConditions:
                  data.child!.medicalConditions ?? c.medicalConditions,
                emergencyContacts:
                  data.child!.emergencyContacts ?? c.emergencyContacts,
                physicianName: data.child!.physicianName ?? c.physicianName,
                physicianPhone: data.child!.physicianPhone ?? c.physicianPhone,
              }
            : c,
        ),
      );
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setPending(false);
    }
  };

  const updateConsent = async (
    registrationId: string,
    key: "shareAllergies" | "shareMeds" | "shareContacts",
    value: boolean,
  ) => {
    setPending(true);
    try {
      const res = await fetch("/api/parent/emergency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ registrationId, [key]: value }),
      });
      if (!res.ok) {
        toast.error(t("errors.consentFailed"));
        return;
      }
      setChildren((prev) =>
        prev.map((c) => ({
          ...c,
          programs: c.programs.map((p) =>
            p.registrationId === registrationId ? { ...p, [key]: value } : p,
          ),
        })),
      );
      toast.success(t("consentSaved"));
    } catch {
      toast.error(t("errors.consentFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t("intro")}
      </p>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label={t("childPicker")}
      >
        {children.map((c) => (
          <button
            key={c.childId}
            type="button"
            role="tab"
            aria-selected={selectedId === c.childId}
            onClick={() => setSelectedId(c.childId)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
              selectedId === c.childId
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {c.firstName} {c.lastName}
          </button>
        ))}
      </div>

      {child ? (
        <>
          <nav
            className="flex gap-1 overflow-x-auto border-b border-border"
            aria-label={t("sectionsLabel")}
          >
            {SECTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={cn(
                  "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  section === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
                aria-current={section === key ? "page" : undefined}
              >
                {t(`sections.${key}`)}
              </button>
            ))}
          </nav>

          {section === "allergies" ? (
            <BezelCard className="space-y-4 p-5 md:p-6">
              <p className="text-sm text-muted-foreground">{t("allergiesHint")}</p>
              <AllergyTagInput
                items={child.allergyItems}
                onChange={(allergyItems) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.childId === child.childId ? { ...c, allergyItems } : c,
                    ),
                  )
                }
                notes={child.allergies ?? ""}
                onNotesChange={(allergies) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.childId === child.childId ? { ...c, allergies } : c,
                    ),
                  )
                }
              />
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  saveHealth({
                    allergyItems: child.allergyItems,
                    allergies: child.allergies,
                  })
                }
              >
                {pending ? t("saving") : t("saveSection")}
              </Button>
            </BezelCard>
          ) : null}

          {section === "meds" ? (
            <BezelCard className="space-y-4 p-5 md:p-6">
              <MedicationRows
                value={child.medications}
                onChange={(medications) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.childId === child.childId ? { ...c, medications } : c,
                    ),
                  )
                }
              />
              <Button
                type="button"
                disabled={pending}
                onClick={() => saveHealth({ medications: child.medications })}
              >
                {pending ? t("saving") : t("saveSection")}
              </Button>
            </BezelCard>
          ) : null}

          {section === "conditions" ? (
            <BezelCard className="space-y-4 p-5 md:p-6">
              <TextField
                id="emergency-conditions"
                label={t("conditionsLabel")}
                value={child.medicalConditions ?? ""}
                onChange={(e) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.childId === child.childId
                        ? { ...c, medicalConditions: e.target.value }
                        : c,
                    ),
                  )
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="emergency-physician-name"
                  label={t("physicianName")}
                  value={child.physicianName ?? ""}
                  onChange={(e) =>
                    setChildren((prev) =>
                      prev.map((c) =>
                        c.childId === child.childId
                          ? { ...c, physicianName: e.target.value }
                          : c,
                      ),
                    )
                  }
                />
                <TextField
                  id="emergency-physician-phone"
                  label={t("physicianPhone")}
                  value={child.physicianPhone ?? ""}
                  onChange={(e) =>
                    setChildren((prev) =>
                      prev.map((c) =>
                        c.childId === child.childId
                          ? { ...c, physicianPhone: e.target.value }
                          : c,
                      ),
                    )
                  }
                />
              </div>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  saveHealth({
                    medicalConditions: child.medicalConditions,
                    physicianName: child.physicianName,
                    physicianPhone: child.physicianPhone,
                  })
                }
              >
                {pending ? t("saving") : t("saveSection")}
              </Button>
            </BezelCard>
          ) : null}

          {section === "contacts" ? (
            <BezelCard className="space-y-4 p-5 md:p-6">
              <EmergencyContactRows
                value={child.emergencyContacts}
                onChange={(emergencyContacts) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.childId === child.childId
                        ? { ...c, emergencyContacts }
                        : c,
                    ),
                  )
                }
              />
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  saveHealth({ emergencyContacts: child.emergencyContacts })
                }
              >
                {pending ? t("saving") : t("saveSection")}
              </Button>
            </BezelCard>
          ) : null}

          {section === "sharing" ? (
            <div className="space-y-4">
              {child.programs.length === 0 ? (
                <BezelCard className="p-5">
                  <p className="text-sm text-muted-foreground">
                    {t("noPrograms")}
                  </p>
                </BezelCard>
              ) : (
                child.programs.map((program) => (
                  <BezelCard key={program.registrationId} className="space-y-4 p-5">
                    <div>
                      <p className="font-medium text-foreground">
                        {program.programName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {program.orgName}
                      </p>
                    </div>
                    <ConsentToggle
                      label={t("shareAllergies")}
                      checked={program.shareAllergies}
                      disabled={pending}
                      onChange={(v) =>
                        updateConsent(
                          program.registrationId,
                          "shareAllergies",
                          v,
                        )
                      }
                    />
                    <ConsentToggle
                      label={t("shareMeds")}
                      checked={program.shareMeds}
                      disabled={pending}
                      onChange={(v) =>
                        updateConsent(program.registrationId, "shareMeds", v)
                      }
                    />
                    <ConsentToggle
                      label={t("shareContacts")}
                      checked={program.shareContacts}
                      disabled={pending}
                      onChange={(v) =>
                        updateConsent(
                          program.registrationId,
                          "shareContacts",
                          v,
                        )
                      }
                    />
                  </BezelCard>
                ))
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ConsentToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-out",
          checked ? "bg-primary" : "bg-muted",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out",
            checked && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}
