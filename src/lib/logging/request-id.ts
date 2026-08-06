import { headers } from "next/headers";

export const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export async function getRequestId(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get(REQUEST_ID_HEADER) ?? generateRequestId();
}
