"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { OnboardingStepper } from "@/components/business/onboarding/onboarding-stepper";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  INCIDENT_FORM_STEPS,
  incidentTemplatesForOrgType,
  type IncidentFormStep,
} from "@/lib/incidents/incident-constants";
import type {
  IncidentFormContext,
  IncidentWitness,
} from "@/lib/incidents/incident-types";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "@/lib/reports/media-constants";
import { stripExifFromImageFile } from "@/lib/reports/strip-exif-client";
import { cn } from "@/lib/utils";

type IncidentReportWizardProps = {
  initialContext: IncidentFormContext;
  initialProgramId?: string;
};

const BODY_AREAS = [
  "head",
  "neck",
  "chest",
  "back",
  "left_arm",
  "right_arm",
  "left_leg",
  "right_leg",
  "abdomen",
] as const;

type PhotoPreview = {
  id: string;
  file: File;
  url: string;
};

function stepIndex(step: IncidentFormStep): number {
  return INCIDENT_FORM_STEPS.indexOf(step) + 1;
}

export function IncidentReportWizard({
  initialContext,
  initialProgramId,
}: IncidentReportWizardProps) {
  const t = useTranslations("coach.incidents.form");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<IncidentFormStep>("type");
  const [programId, setProgramId] = useState(
    initialProgramId ?? initialContext.programs[0]?.id ?? "",
  );
  const [incidentType, setIncidentType] = useState("");
  const [childId, setChildId] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [location, setLocation] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [bodyArea, setBodyArea] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [painLevel, setPainLevel] = useState<number | "">("");
  const [witnesses, setWitnesses] = useState<IncidentWitness[]>([]);
  const [actionTaken, setActionTaken] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = useMemo(
    () => incidentTemplatesForOrgType(initialContext.orgType),
    [initialContext.orgType],
  );

  const selectedTemplate = templates.find((tpl) => tpl.id === incidentType);
  const isRed = selectedTemplate?.isRedFlag ?? false;

  const rosterChildren = useMemo(
    () => initialContext.children.filter((c) => c.programId === programId),
    [initialContext.children, programId],
  );

  const selectedChild = rosterChildren.find((c) => c.childId === childId);

  const stepLabels = [
    t("steps.type"),
    t("steps.details"),
    t("steps.witnesses"),
    t("steps.actions"),
    t("steps.photos"),
    t("steps.review"),
  ];

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case "type":
        return Boolean(incidentType);
      case "details":
        if (!childId || !location.trim() || !symptoms.trim()) return false;
        if (selectedTemplate?.requiresBodyMap && !bodyArea) return false;
        return true;
      case "witnesses":
        return true;
      case "actions":
        return Boolean(actionTaken.trim());
      case "photos":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [
    step,
    incidentType,
    childId,
    location,
    symptoms,
    selectedTemplate,
    bodyArea,
    actionTaken,
  ]);

  const goNext = () => {
    if (!canAdvance()) {
      setError(t("validation.required"));
      return;
    }
    setError(null);
    const idx = INCIDENT_FORM_STEPS.indexOf(step);
    if (idx < INCIDENT_FORM_STEPS.length - 1) {
      setStep(INCIDENT_FORM_STEPS[idx + 1]!);
    }
  };

  const goBack = () => {
    setError(null);
    const idx = INCIDENT_FORM_STEPS.indexOf(step);
    if (idx > 0) {
      setStep(INCIDENT_FORM_STEPS[idx - 1]!);
    }
  };

  const addWitness = () => {
    setWitnesses((prev) => [...prev, { name: "", role: "" }]);
  };

  const updateWitness = (index: number, patch: Partial<IncidentWitness>) => {
    setWitnesses((prev) =>
      prev.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  };

  const removeWitness = (index: number) => {
    setWitnesses((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: PhotoPreview[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) continue;
      if (file.size > MAX_PHOTO_BYTES) continue;
      const stripped = await stripExifFromImageFile(file);
      const blob =
        stripped instanceof File ? stripped : new File([stripped], file.name, { type: file.type });
      next.push({
        id: crypto.randomUUID(),
        file: blob,
        url: URL.createObjectURL(blob),
      });
    }
    setPhotos((prev) => [...prev, ...next].slice(0, 6));
  };

  const submit = async () => {
    if (!canAdvance()) {
      setError(t("validation.required"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        programId,
        childId,
        incidentType,
        occurredAt: new Date(occurredAt).toISOString(),
        location,
        mechanism,
        bodyArea: bodyArea || null,
        symptoms,
        painLevel: painLevel === "" ? null : painLevel,
        actionTaken,
        witnesses: witnesses.filter((w) => w.name.trim()),
      };

      const form = new FormData();
      form.set("payload", JSON.stringify(payload));
      for (const p of photos) {
        form.append("photos", p.file);
      }

      const res = await fetch("/api/coach/incidents", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        isRedFlag?: boolean;
      };

      if (!res.ok || !body.ok) {
        setError(t(`errors.${body.error ?? "create_failed"}`));
        return;
      }

      toast.success(
        body.isRedFlag ? t("successRed") : t("success"),
      );
      router.push("/coach/incidents");
      router.refresh();
    } catch {
      setError(t("errors.create_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl space-y-8",
        isRed && "incident-red-context",
      )}
    >
      {isRed && (
        <div
          className="flex items-start gap-3 rounded-[1rem] border border-destructive/25 bg-destructive/5 px-4 py-3.5 motion-safe:animate-[incident-red-enter_320ms_cubic-bezier(0.32,0.72,0,1)]"
          role="status"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">{t("redBanner.title")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("redBanner.body")}</p>
          </div>
        </div>
      )}

      <OnboardingStepper
        currentStep={stepIndex(step)}
        totalSteps={INCIDENT_FORM_STEPS.length}
        labels={stepLabels}
      />

      <div
        className={cn(
          "rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8",
          isRed && "ring-destructive/20",
        )}
      >
        {step === "type" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("type.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("type.subtitle")}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setIncidentType(tpl.id)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-left text-sm transition-[background-color,box-shadow,transform] duration-[220ms] ease-out active:scale-[0.98]",
                    incidentType === tpl.id
                      ? tpl.isRedFlag
                        ? "bg-destructive/10 ring-2 ring-destructive/40"
                        : "bg-primary/10 ring-2 ring-primary/30"
                      : "bg-secondary/50 hover:bg-secondary",
                  )}
                >
                  <span className="font-medium text-foreground">
                    {t(`types.${tpl.labelKey}`)}
                  </span>
                  {tpl.isRedFlag && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="size-3" aria-hidden />
                      {t("type.redFlag")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("details.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("details.subtitle")}</p>
            </div>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">{t("details.program")}</span>
              <select
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setChildId("");
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
              >
                {initialContext.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t("details.child")}</span>
              <div className="grid gap-2">
                {rosterChildren.map((child) => (
                  <button
                    key={child.childId}
                    type="button"
                    onClick={() => setChildId(child.childId)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,box-shadow] duration-[220ms] ease-out",
                      childId === child.childId
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-secondary/50 hover:bg-secondary",
                    )}
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {child.photoSignedUrl ? (
                        <Image
                          src={child.photoSignedUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="m-auto size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {child.firstName} {child.lastName}
                      </p>
                      {child.allergies.length > 0 && (
                        <p className="truncate text-xs text-amber-700 dark:text-amber-400">
                          {t("details.allergies")}:{" "}
                          {child.allergies.map((a) => a.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                {rosterChildren.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("details.noChildren")}</p>
                )}
              </div>
            </div>

            <TextField
              id="incident-occurred-at"
              label={t("details.occurredAt")}
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
            <TextField
              id="incident-location"
              label={t("details.location")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("details.locationPlaceholder")}
              required
            />
            <TextField
              id="incident-mechanism"
              label={t("details.mechanism")}
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              placeholder={t("details.mechanismPlaceholder")}
            />
            {selectedTemplate?.requiresBodyMap && (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-foreground">
                  {t("details.bodyArea")} *
                </span>
                <select
                  value={bodyArea}
                  onChange={(e) => setBodyArea(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  required
                >
                  <option value="">{t("details.bodyAreaPlaceholder")}</option>
                  {BODY_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {t(`bodyAreas.${area}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">{t("details.symptoms")} *</span>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                placeholder={t("details.symptomsPlaceholder")}
                required
              />
            </label>
            <TextField
              id="incident-pain-level"
              label={t("details.painLevel")}
              type="number"
              min={1}
              max={10}
              value={painLevel === "" ? "" : String(painLevel)}
              onChange={(e) =>
                setPainLevel(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>
        )}

        {step === "witnesses" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("witnesses.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("witnesses.subtitle")}</p>
            </div>
            {witnesses.map((w, i) => (
              <div key={i} className="flex gap-2">
                <TextField
                  id={`witness-name-${i}`}
                  label={t("witnesses.name")}
                  value={w.name}
                  onChange={(e) => updateWitness(i, { name: e.target.value })}
                  containerClassName="flex-1"
                />
                <TextField
                  id={`witness-role-${i}`}
                  label={t("witnesses.role")}
                  value={w.role}
                  onChange={(e) => updateWitness(i, { role: e.target.value })}
                  containerClassName="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeWitness(i)}
                  className="mt-6 rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={t("witnesses.remove")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addWitness}>
              <Plus className="size-4" />
              {t("witnesses.add")}
            </Button>
          </div>
        )}

        {step === "actions" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("actions.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("actions.subtitle")}</p>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">{t("actions.label")} *</span>
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5"
                placeholder={t("actions.placeholder")}
                required
              />
            </label>
          </div>
        )}

        {step === "photos" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("photos.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("photos.subtitle")}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={Array.from(ALLOWED_PHOTO_TYPES).join(",")}
              multiple
              className="sr-only"
              onChange={(e) => void handlePhotos(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 transition-[background-color,transform] duration-[220ms] ease-out hover:bg-secondary/50 active:scale-[0.99]"
            >
              <Camera className="size-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t("photos.add")}</span>
            </button>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg">
                    <Image src={p.url} alt="" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-foreground">{t("review.title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("review.subtitle")}</p>
            </div>
            <dl className="divide-y divide-border/60 text-sm">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{t("review.type")}</dt>
                <dd className="text-right font-medium">
                  {selectedTemplate ? t(`types.${selectedTemplate.labelKey}`) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{t("review.child")}</dt>
                <dd className="text-right font-medium">
                  {selectedChild
                    ? `${selectedChild.firstName} ${selectedChild.lastName}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{t("review.when")}</dt>
                <dd className="text-right font-medium">
                  {new Date(occurredAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{t("review.location")}</dt>
                <dd className="text-right font-medium">{location || "—"}</dd>
              </div>
              {isRed && (
                <div className="flex items-center gap-2 py-2 text-destructive">
                  <ShieldAlert className="size-4" />
                  <span className="text-sm font-medium">{t("review.redNotify")}</span>
                </div>
              )}
            </dl>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {step === "type" ? (
          <Link
            href="/coach/incidents"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {t("cancel")}
          </Link>
        ) : (
          <Button type="button" variant="ghost" onClick={goBack}>
            <ChevronLeft className="size-4" />
            {t("back")}
          </Button>
        )}

        {step === "review" ? (
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={!canAdvance()}>
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
