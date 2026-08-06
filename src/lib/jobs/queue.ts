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

export { RETRY_DELAYS_MS };

export function getNextRetryAt(attempts: number): Date | null {
  const delay = RETRY_DELAYS_MS[attempts];
  if (delay == null) return null;
  return new Date(Date.now() + delay);
}

export {
  enqueueJob,
  processBackgroundJobs,
  registerJobHandler,
} from "./processor";
