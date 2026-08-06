// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parentFormsTable(client: { from: (table: string) => any }): any {
  return client.from("parent_forms" as "profiles");
}
