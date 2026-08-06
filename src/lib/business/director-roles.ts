/** Common leadership titles for youth-program operators. */
export const DIRECTOR_ROLES = [
  "director",
  "executive_director",
  "owner",
  "founder",
  "program_director",
  "site_supervisor",
  "administrator",
  "principal",
  "head_coach",
  "athletic_director",
  "camp_director",
  "lead_teacher",
  "coordinator",
  "manager",
  "other",
] as const;

export type DirectorRole = (typeof DIRECTOR_ROLES)[number];

export const DIRECTOR_ROLE_VALUES: readonly DirectorRole[] = DIRECTOR_ROLES;

export function isDirectorRole(value: string): value is DirectorRole {
  return (DIRECTOR_ROLES as readonly string[]).includes(value);
}
