import type { CountryCode } from "@/lib/geo/regions";
import type { DoctorSpecialty } from "@/lib/doctors/doctor-specialties";

export type DoctorRecord = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  bio: string | null;
  specialty: DoctorSpecialty;
  languages: string[];
  country: CountryCode;
  region: string | null;
  bookingUrl: string;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DoctorListItem = Pick<
  DoctorRecord,
  | "id"
  | "displayName"
  | "photoUrl"
  | "specialty"
  | "languages"
  | "country"
  | "region"
  | "isFeatured"
  | "bio"
>;

export type DoctorDirectoryContext = {
  parentCountry: CountryCode | null;
  parentRegion: string | null;
  incidentPrefill: IncidentBookingPrefill | null;
};

export type IncidentBookingPrefill = {
  incidentId: string;
  childId: string;
  childName: string;
  incidentType: string;
  occurredAt: string;
  summary: string;
};

export type CreateDoctorInput = {
  displayName: string;
  photoUrl?: string | null;
  bio?: string | null;
  specialty: DoctorSpecialty;
  languages: string[];
  country: CountryCode;
  region?: string | null;
  bookingUrl: string;
  isFeatured?: boolean;
  sortOrder?: number;
};

export type UpdateDoctorInput = Partial<CreateDoctorInput> & {
  isActive?: boolean;
};

export type DoctorAuditEntry = {
  id: string;
  doctorId: string | null;
  adminId: string;
  action: "create" | "update" | "deactivate" | "reactivate";
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown>;
  createdAt: string;
};
