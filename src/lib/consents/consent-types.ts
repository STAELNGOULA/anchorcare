export type ProgramConsentItem = {
  registrationId: string;
  childId: string;
  childName: string;
  programId: string;
  programName: string;
  orgName: string;
  status: "pending" | "active" | "withdrawn";
  sharePhotos: boolean;
  shareMedical: boolean;
  shareEmergency: boolean;
};

export type ParentNotificationPreferences = {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailDigestEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
};

export type UpdateProgramConsentInput = {
  registrationId: string;
  sharePhotos?: boolean;
  shareMedical?: boolean;
  shareEmergency?: boolean;
};

export type UpdateNotificationPreferencesInput = Partial<{
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailDigestEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}>;
