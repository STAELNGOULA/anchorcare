import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_MS = 60_000;
const MAX_VIEWS_PER_IP = 40;

export type SmsRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

function bucketKey(ip: string): string {
  return `sms-report:${ip}`;
}

export async function checkSmsReportRateLimit(
  ip: string,
): Promise<SmsRateLimitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { allowed: true };
  }

  const supabase = createServiceClient();
  const key = bucketKey(ip);
  const now = new Date();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!row) return { allowed: true };

  const windowStart = new Date(row.window_started_at);
  if (now.getTime() - windowStart.getTime() > WINDOW_MS) {
    return { allowed: true };
  }

  if (row.attempt_count >= MAX_VIEWS_PER_IP) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true };
}

export async function recordSmsReportView(ip: string): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const key = bucketKey(ip);
  const now = new Date();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!row) {
    await supabase.from("auth_rate_limits").insert({
      bucket_key: key,
      attempt_count: 1,
      window_started_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    return;
  }

  const windowStart = new Date(row.window_started_at);
  const windowExpired = now.getTime() - windowStart.getTime() > WINDOW_MS;
  const nextCount = windowExpired ? 1 : row.attempt_count + 1;
  const windowStartedAt = windowExpired ? now : windowStart;

  await supabase.from("auth_rate_limits").upsert({
    bucket_key: key,
    attempt_count: nextCount,
    window_started_at: windowStartedAt.toISOString(),
    locked_until: null,
    updated_at: now.toISOString(),
  });
}
