/** Build phase tags aligned with USER_JOURNEYS.md */
export type BuildPhase = "mvp" | "p15" | "p2" | "p3";

export const PHASE_LABEL_KEYS: Record<BuildPhase, string> = {
  mvp: "phaseMvp",
  p15: "phaseP15",
  p2: "phaseP2",
  p3: "phaseP3",
};

export type SurfaceConfig = {
  /** next-intl namespace suffix, e.g. parent.care.doctors */
  namespace: string;
  phase: BuildPhase;
  specId?: string;
};
