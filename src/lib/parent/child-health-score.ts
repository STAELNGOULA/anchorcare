import type { AllergyItem, ChildMedication, EmergencyContact } from "@/lib/parent/child-types";

type HealthScoreInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  allergyItems: AllergyItem[];
  allergies: string | null;
  medications: ChildMedication[];
  medicalConditions: string | null;
  emergencyContacts: EmergencyContact[];
  physicianName: string | null;
  physicianPhone: string | null;
  photoUrl: string | null;
};

export function computeHealthScore(input: HealthScoreInput): number {
  let score = 0;

  if (input.firstName.trim() && input.lastName.trim()) score += 15;
  if (input.dateOfBirth) score += 15;

  const hasAllergyDoc =
    input.allergyItems.length > 0 || Boolean(input.allergies?.trim());
  if (hasAllergyDoc) score += 15;

  if (input.medications.length > 0) score += 15;

  if (input.medicalConditions?.trim()) score += 10;

  const validContacts = input.emergencyContacts.filter(
    (c) => c.name.trim() && c.phone.trim() && c.relation.trim(),
  );
  if (validContacts.length >= 1) score += 20;
  if (validContacts.length >= 2) score += 5;

  if (input.physicianName?.trim() && input.physicianPhone?.trim()) score += 10;

  if (input.photoUrl) score += 5;

  return Math.min(100, score);
}

export function healthScoreLabel(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}
