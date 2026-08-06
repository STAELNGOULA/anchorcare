// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function incidentConsultsTable(client: { from: (table: string) => any }): any {
  return client.from("incident_consults" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function incidentConsultMessagesTable(client: { from: (table: string) => any }): any {
  return client.from("incident_consult_messages" as "profiles");
}
