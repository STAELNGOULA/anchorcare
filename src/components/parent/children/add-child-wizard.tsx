"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AllergyTagInput } from "@/components/parent/children/allergy-tag-input";
import { EmergencyContactRows } from "@/components/parent/children/emergency-contact-rows";
import { MedicationRows } from "@/components/parent/children/medication-rows";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AllergyItem, ChildMedication, EmergencyContact } from "@/lib/parent/child-types";
import type { ChildListItem } from "@/lib/parent/child-types";

type AddChildWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siblings: ChildListItem[];
};

type Step = "profile" | "health" | "emergency";

export function AddChildWizard({ open, onOpenChange, siblings }: AddChildWizardProps) {
  const t = useTranslations("parent.family.children.wizard");
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [pending, setPending] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [copyFromChildId, setCopyFromChildId] = useState("");
  const [allergyItems, setAllergyItems] = useState<AllergyItem[]>([]);
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState<ChildMedication[]>([]);
  const [medicalConditions, setMedicalConditions] = useState("");
  const [physicianName, setPhysicianName] = useState("");
  const [physicianPhone, setPhysicianPhone] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relation: "" },
  ]);

  const reset = () => {
    setStep("profile");
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setCopyFromChildId("");
    setAllergyItems([]);
    setAllergies("");
    setMedications([]);
    setMedicalConditions("");
    setPhysicianName("");
    setPhysicianPhone("");
    setInsuranceInfo("");
    setEmergencyContacts([{ name: "", phone: "", relation: "" }]);
  };

  const submit = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          allergyItems,
          allergies: allergies.trim() || null,
          medications: medications.filter((m) => m.name.trim()),
          medicalConditions: medicalConditions.trim() || null,
          physicianName: physicianName.trim() || null,
          physicianPhone: physicianPhone.trim() || null,
          insuranceInfo: insuranceInfo.trim() || null,
          emergencyContacts: emergencyContacts.filter(
            (c) => c.name.trim() && c.phone.trim() && c.relation.trim(),
          ),
          copyFromChildId: copyFromChildId || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; child?: { id: string }; error?: string };
      if (!res.ok || !data.ok || !data.child) {
        toast.error(t(`errors.${data.error ?? "createFailed"}` as "errors.createFailed"));
        return;
      }
      toast.success(t("success"));
      onOpenChange(false);
      reset();
      router.push(`/parent/family/children/${data.child.id}`);
      router.refresh();
    } catch {
      toast.error(t("errors.createFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{t("title")}</DialogTitle>
          <DialogDescription>{t(`steps.${step}`)}</DialogDescription>
        </DialogHeader>

        {step === "profile" ? (
          <div className="space-y-4">
            {siblings.length > 0 ? (
              <div className="space-y-2">
                <label htmlFor="copy-sibling" className="text-sm font-medium">
                  {t("copyFromSibling")}
                </label>
                <select
                  id="copy-sibling"
                  value={copyFromChildId}
                  onChange={(e) => setCopyFromChildId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t("copyNone")}</option>
                  {siblings.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <TextField
              id="firstName"
              label={t("firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <TextField
              id="lastName"
              label={t("lastName")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <TextField
              id="dob"
              label={t("dateOfBirth")}
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={!firstName.trim() || !lastName.trim() || !dateOfBirth}
              onClick={() => setStep("health")}
            >
              {t("continue")}
            </Button>
          </div>
        ) : null}

        {step === "health" ? (
          <div className="space-y-4">
            <AllergyTagInput
              items={allergyItems}
              onChange={setAllergyItems}
              notes={allergies}
              onNotesChange={setAllergies}
            />
            <MedicationRows value={medications} onChange={setMedications} />
            <TextField
              id="conditions"
              label={t("medicalConditions")}
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep("profile")}>
                {t("back")}
              </Button>
              <Button type="button" className="flex-1 rounded-full" onClick={() => setStep("emergency")}>
                {t("continue")}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "emergency" ? (
          <div className="space-y-4">
            <EmergencyContactRows
              value={emergencyContacts}
              onChange={setEmergencyContacts}
            />
            <TextField
              id="physicianName"
              label={t("physicianName")}
              value={physicianName}
              onChange={(e) => setPhysicianName(e.target.value)}
            />
            <TextField
              id="physicianPhone"
              label={t("physicianPhone")}
              type="tel"
              value={physicianPhone}
              onChange={(e) => setPhysicianPhone(e.target.value)}
            />
            <TextField
              id="insurance"
              label={t("insurance")}
              value={insuranceInfo}
              onChange={(e) => setInsuranceInfo(e.target.value)}
              hint={t("insuranceHint")}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep("health")}>
                {t("back")}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-full"
                disabled={pending}
                onClick={() => void submit()}
              >
                {pending ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
