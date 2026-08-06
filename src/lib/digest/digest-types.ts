export type OrgDigestSettings = {
  orgId: string;
  businessEnabled: boolean;
  businessDeliveryDay: number;
  businessRecipientEmails: string[];
  coachDigestEnabled: boolean;
  timezone: string;
};

export type UpdateOrgDigestSettingsInput = {
  businessEnabled: boolean;
  businessDeliveryDay: number;
  businessRecipientEmails: string[];
  coachDigestEnabled: boolean;
  timezone: string;
};

export type ParentDigestChildSummary = {
  childId: string;
  childName: string;
  programName: string;
  reportsCount: number;
  photoCount: number;
  incidentCount: number;
};

export type BusinessDigestMetrics = {
  orgName: string;
  activationPercent: number;
  reportsThisWeek: number;
  incidents7d: number;
  voiceDaysUsed: number;
  waporPercent: number | null;
  trialDaysLeft: number | null;
  funnelReportRead: number;
  funnelRegistered: number;
};
