/** Youth-program categories Anchor Care supports at onboarding. */
export const ORG_TYPES = [
  "daycare",
  "preschool",
  "sports",
  "camp",
  "after_school",
  "enrichment",
  "arts",
  "martial_arts",
  "swim",
  "community",
  "faith",
  "homeschool",
  "therapy",
  "nanny",
  "other",
] as const;

export type OrgType = (typeof ORG_TYPES)[number];

export const ORG_TYPE_VALUES: readonly OrgType[] = ORG_TYPES;

export function isOrgType(value: string): value is OrgType {
  return (ORG_TYPES as readonly string[]).includes(value);
}
