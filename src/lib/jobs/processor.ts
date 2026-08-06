import { createServiceClient } from "@/lib/supabase/service";
import { childLogger } from "@/lib/logging/logger";
import type { Json } from "@/types/supabase";
import {
  getNextRetryAt,
  type JobStatus,
  type EnqueueJobInput,
} from "@/lib/jobs/queue";
import { RETRY_DELAYS_MS } from "@/schemas/jobs";

export type { EnqueueJobInput, JobStatus };
export { getNextRetryAt };

type JobRow = {
  id: string;
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  idempotency_key: string | null;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  last_error: string | null;
};

export type JobHandler = (
  job: JobRow,
) => Promise<void> | void;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

export async function enqueueJob(
  input: EnqueueJobInput,
): Promise<{ id: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    childLogger({}).warn(
      { type: input.type, idempotencyKey: input.idempotencyKey },
      "[jobs] enqueue dev noop",
    );
    return { id: crypto.randomUUID() };
  }

  const supabase = createServiceClient();

  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("background_jobs")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (existing) {
      return { id: existing.id };
    }
  }

  const { data, error } = await supabase
    .from("background_jobs")
    .insert({
      type: input.type,
      payload: input.payload as Json,
      idempotency_key: input.idempotencyKey ?? null,
      status: "pending",
      next_run_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && input.idempotencyKey) {
      const { data: dup } = await supabase
        .from("background_jobs")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .single();
      if (dup) return { id: dup.id };
    }
    throw error;
  }

  return { id: data.id };
}

export type ProcessJobsResult = {
  processed: number;
  completed: number;
  failed: number;
  deadLetter: number;
};

/**
 * Claim and process pending/failed jobs with FOR UPDATE SKIP LOCKED semantics
 * via optimistic status transition (service role only).
 */
export async function processBackgroundJobs(
  limit = 10,
): Promise<ProcessJobsResult> {
  const log = childLogger({});
  const result: ProcessJobsResult = {
    processed: 0,
    completed: 0,
    failed: 0,
    deadLetter: 0,
  };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log.warn("[jobs] process skipped — no service role key");
    return result;
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: jobs, error } = await supabase
    .from("background_jobs")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_run_at", now)
    .order("next_run_at", { ascending: true })
    .limit(limit * 3);

  if (error) throw error;
  if (!jobs?.length) return result;

  const sorted = [...(jobs as JobRow[])].sort((a, b) => {
    const aHigh = a.payload?.priority === "high" ? 1 : 0;
    const bHigh = b.payload?.priority === "high" ? 1 : 0;
    if (bHigh !== aHigh) return bHigh - aHigh;
    return new Date(a.next_run_at).getTime() - new Date(b.next_run_at).getTime();
  });

  const batch = sorted.slice(0, limit);

  for (const job of batch) {
    const { data: claimed } = await supabase
      .from("background_jobs")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    result.processed += 1;
    const handler = handlers.get(job.type);

    try {
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      await handler(job);

      await supabase
        .from("background_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", job.id);

      result.completed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown job error";
      const nextAttempts = job.attempts + 1;
      const maxAttempts = job.max_attempts ?? RETRY_DELAYS_MS.length;
      const isDead = nextAttempts >= maxAttempts;
      const nextRun = getNextRetryAt(nextAttempts);

      await supabase
        .from("background_jobs")
        .update({
          status: isDead ? "dead_letter" : "failed",
          attempts: nextAttempts,
          last_error: message,
          next_run_at: isDead
            ? new Date().toISOString()
            : (nextRun?.toISOString() ?? new Date().toISOString()),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (isDead) {
        result.deadLetter += 1;
        log.error({ jobId: job.id, type: job.type, message }, "job dead letter");
      } else {
        result.failed += 1;
        log.warn({ jobId: job.id, type: job.type, message }, "job retry scheduled");
      }
    }
  }

  return result;
}
