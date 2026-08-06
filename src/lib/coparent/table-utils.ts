// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function childGuardiansTable(client: { from: (table: string) => any }): any {
  return client.from("child_guardians" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function childGuardianInvitesTable(client: { from: (table: string) => any }): any {
  return client.from("child_guardian_invites" as "profiles");
}
