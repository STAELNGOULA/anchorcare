// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function visitReportsTable(client: { from: (table: string) => any }): any {
  return client.from("visit_reports" as "profiles");
}
