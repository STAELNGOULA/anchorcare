export type IncidentSeverity = "green" | "yellow" | "red";

export type IncidentTemplateType = {
  id: string;
  labelKey: string;
  severity: IncidentSeverity;
  isRedFlag: boolean;
  requiresBodyMap?: boolean;
};

const BASE_TYPES: IncidentTemplateType[] = [
  { id: "minor_bump", labelKey: "minorBump", severity: "green", isRedFlag: false },
  { id: "scrape", labelKey: "scrape", severity: "green", isRedFlag: false },
  { id: "behavioral", labelKey: "behavioral", severity: "yellow", isRedFlag: false },
  { id: "illness", labelKey: "illness", severity: "yellow", isRedFlag: false },
  { id: "allergic_mild", labelKey: "allergicMild", severity: "yellow", isRedFlag: false },
  { id: "fall", labelKey: "fall", severity: "yellow", isRedFlag: false },
  { id: "head_injury", labelKey: "headInjury", severity: "red", isRedFlag: true },
  { id: "concussion", labelKey: "concussion", severity: "red", isRedFlag: true, requiresBodyMap: true },
  { id: "unconsciousness", labelKey: "unconsciousness", severity: "red", isRedFlag: true },
  { id: "severe_bleeding", labelKey: "severeBleeding", severity: "red", isRedFlag: true },
  { id: "allergic_severe", labelKey: "allergicSevere", severity: "red", isRedFlag: true },
  { id: "seizure", labelKey: "seizure", severity: "red", isRedFlag: true },
  { id: "difficulty_breathing", labelKey: "difficultyBreathing", severity: "red", isRedFlag: true },
];

const SPORTS_EXTRA: IncidentTemplateType[] = [
  { id: "collision", labelKey: "collision", severity: "yellow", isRedFlag: false, requiresBodyMap: true },
  { id: "sprain", labelKey: "sprain", severity: "yellow", isRedFlag: false, requiresBodyMap: true },
];

const DAYCARE_EXTRA: IncidentTemplateType[] = [
  { id: "bite", labelKey: "bite", severity: "yellow", isRedFlag: false },
  { id: "choking_scare", labelKey: "chokingScare", severity: "red", isRedFlag: true },
];

export function incidentTemplatesForOrgType(
  orgType: string | null,
): IncidentTemplateType[] {
  const types = [...BASE_TYPES];
  if (orgType === "sports" || orgType === "martial_arts" || orgType === "swim") {
    types.push(...SPORTS_EXTRA);
  }
  if (orgType === "daycare" || orgType === "preschool" || orgType === "after_school") {
    types.push(...DAYCARE_EXTRA);
  }
  return types;
}

export function templateById(
  orgType: string | null,
  typeId: string,
): IncidentTemplateType | undefined {
  return incidentTemplatesForOrgType(orgType).find((t) => t.id === typeId);
}

export const INCIDENT_FORM_STEPS = [
  "type",
  "details",
  "witnesses",
  "actions",
  "photos",
  "review",
] as const;

export type IncidentFormStep = (typeof INCIDENT_FORM_STEPS)[number];

export const INCIDENT_PHOTOS_BUCKET = "photos";

export const MAX_INCIDENT_PHOTO_BYTES = 10 * 1024 * 1024;
