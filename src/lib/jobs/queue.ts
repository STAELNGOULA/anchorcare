import { RETRY_DELAYS_MS } from "@/schemas/jobs";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "dead_letter";

export type EnqueueJobInput = {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};

export function getNextRetryAt(attempts: number): Date | null {
  const delay = RETRY_DELAYS_MS[attempts];
  if (delay == null) return null;
  return new Date(Date.now() + delay);
}

/**
 * Enqueue a background job. Implementation persists to `background_jobs` via
 * service client once Supabase project is provisioned.
 */
export async function enqueueJob(input: EnqueueJobInput): Promise<{ id: string }> {
  // Placeholder until DB migration is applied — returns synthetic id for dev.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[jobs] enqueue (dev noop):", input.type, input.idempotencyKey);
    return { id: crypto.randomUUID() };
  }

  // Full implementation: insert into background_jobs with ON CONFLICT on idempotency_key
  throw new Error("Job queue persistence not yet wired — apply DB migration first");
}
