import type { HealthSnapshot } from "@/lib/registrations/types";
import type { ChildProfile } from "@/lib/parent/child-types";

export function buildHealthSnapshot(child: ChildProfile): HealthSnapshot {
  return {
    allergies: child.allergies,
    allergyItems: child.allergyItems,
    medications: child.medications.map((m) => ({
      name: m.name,
      dose: m.dose,
      schedule: m.schedule,
    })),
    medicalConditions: child.medicalConditions,
    emergencyContacts: child.emergencyContacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      relation: c.relation,
    })),
    physicianName: child.physicianName,
    physicianPhone: child.physicianPhone,
  };
}

export function parseHealthSnapshot(raw: unknown): HealthSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    allergies: typeof o.allergies === "string" ? o.allergies : null,
    allergyItems: Array.isArray(o.allergyItems) ? (o.allergyItems as HealthSnapshot["allergyItems"]) : [],
    medications: Array.isArray(o.medications) ? (o.medications as HealthSnapshot["medications"]) : [],
    medicalConditions:
      typeof o.medicalConditions === "string" ? o.medicalConditions : null,
    emergencyContacts: Array.isArray(o.emergencyContacts)
      ? (o.emergencyContacts as HealthSnapshot["emergencyContacts"])
      : [],
    physicianName: typeof o.physicianName === "string" ? o.physicianName : null,
    physicianPhone:
      typeof o.physicianPhone === "string" ? o.physicianPhone : null,
  };
}

export type HealthDiffItem = {
  field: string;
  atRegistration: string;
  current: string;
  changed: boolean;
};

export function diffHealthSnapshot(
  snapshot: HealthSnapshot | null,
  current: HealthSnapshot,
): HealthDiffItem[] {
  if (!snapshot) return [];

  const items: HealthDiffItem[] = [];

  const compare = (field: string, a: string, b: string) => {
    const normA = a.trim();
    const normB = b.trim();
    if (normA || normB) {
      items.push({
        field,
        atRegistration: normA || "—",
        current: normB || "—",
        changed: normA !== normB,
      });
    }
  };

  compare("allergies", snapshot.allergies ?? "", current.allergies ?? "");
  compare(
    "medications",
    snapshot.medications.map((m) => m.name).join(", "),
    current.medications.map((m) => m.name).join(", "),
  );
  compare(
    "conditions",
    snapshot.medicalConditions ?? "",
    current.medicalConditions ?? "",
  );
  compare(
    "emergency",
    snapshot.emergencyContacts.map((c) => c.name).join(", "),
    current.emergencyContacts.map((c) => c.name).join(", "),
  );

  return items.filter((i) => i.changed);
}
