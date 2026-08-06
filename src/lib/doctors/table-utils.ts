// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function doctorsTable(client: { from: (table: string) => any }): any {
  return client.from("doctors" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function doctorAuditLogTable(client: { from: (table: string) => any }): any {
  return client.from("doctor_audit_log" as "profiles");
}
