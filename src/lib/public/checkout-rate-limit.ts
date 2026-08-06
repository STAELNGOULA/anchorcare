import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_MS = 60_000;
const MAX_CHECKOUT_PER_WINDOW = 5;

export async function checkCheckoutRateLimit(
  ip: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { allowed: true };

  const supabase = createServiceClient();
  const key = `checkout:${ip}`;
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

  if (row.attempt_count >= MAX_CHECKOUT_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true };
}

export async function recordCheckoutAttempt(ip: string): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const key = `checkout:${ip}`;
  const now = new Date().toISOString();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!row) {
    await supabase.from("auth_rate_limits").insert({
      bucket_key: key,
      attempt_count: 1,
      window_started_at: now,
    });
    return;
  }

  const windowStart = new Date(row.window_started_at);
  if (Date.now() - windowStart.getTime() > WINDOW_MS) {
    await supabase
      .from("auth_rate_limits")
      .update({ attempt_count: 1, window_started_at: now })
      .eq("bucket_key", key);
    return;
  }

  await supabase
    .from("auth_rate_limits")
    .update({ attempt_count: row.attempt_count + 1 })
    .eq("bucket_key", key);
}
