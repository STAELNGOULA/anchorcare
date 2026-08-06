export type HealthCheckStatus = "healthy" | "mild_symptoms" | "staying_home";

export type MorningHealthCheck = {
  id: string;
  childId: string;
  healthStatus: HealthCheckStatus;
  note: string | null;
  checkDate: string;
  createdAt: string;
};

export type SubmitHealthCheckInput = {
  childId: string;
  healthStatus: HealthCheckStatus;
  note?: string | null;
};

export type TodayMorningHealth = {
  childId: string;
  healthStatus: HealthCheckStatus;
  note: string | null;
};
