export const DOCTOR_SPECIALTY_VALUES = [
  "pediatrics",
  "sports_medicine",
  "family_medicine",
  "orthopedics",
  "physiotherapy",
  "concussion",
] as const;

export type DoctorSpecialty = (typeof DOCTOR_SPECIALTY_VALUES)[number];

export const DOCTOR_LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
] as const;
