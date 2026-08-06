import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 60_000;

const RESET_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESET_REQUESTS_PER_WINDOW = 3;

const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const MAX_SIGNUPS_PER_IP = 5;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

function bucketKey(ip: string, email?: string): string {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized ? `login:${ip}:${normalized}` : `login:${ip}`;
}

function resetBucketKey(email: string): string {
  return `reset:${email.trim().toLowerCase()}`;
}

function signupBucketKey(ip: string): string {
  return `signup:${ip}`;
}

export async function checkLoginRateLimit(
  ip: string,
  email?: string,
): Promise<RateLimitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { allowed: true };
  }

  const supabase = createServiceClient();
  const key = bucketKey(ip, email);
  const now = new Date();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (row?.locked_until) {
    const lockedUntil = new Date(row.locked_until);
    if (lockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(
          (lockedUntil.getTime() - now.getTime()) / 1000,
        ),
      };
    }
  }

  if (!row) return { allowed: true };

  const windowStart = new Date(row.window_started_at);
  if (now.getTime() - windowStart.getTime() > WINDOW_MS) {
    return { allowed: true };
  }

  if (row.attempt_count >= MAX_ATTEMPTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (windowStart.getTime() + WINDOW_MS - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true };
}

export async function recordLoginFailure(
  ip: string,
  email?: string,
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const key = bucketKey(ip, email);
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

  const lockedUntil =
    nextCount >= LOCKOUT_THRESHOLD
      ? new Date(now.getTime() + LOCKOUT_MS)
      : null;

  await supabase
    .from("auth_rate_limits")
    .upsert({
      bucket_key: key,
      attempt_count: nextCount,
      window_started_at: windowStartedAt.toISOString(),
      locked_until: lockedUntil?.toISOString() ?? null,
      updated_at: now.toISOString(),
    });
}

export async function clearLoginRateLimit(
  ip: string,
  email?: string,
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  await supabase
    .from("auth_rate_limits")
    .delete()
    .eq("bucket_key", bucketKey(ip, email));
}

export async function checkPasswordResetRateLimit(
  email: string,
): Promise<RateLimitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { allowed: true };
  }

  const supabase = createServiceClient();
  const key = resetBucketKey(email);
  const now = new Date();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!row) return { allowed: true };

  const windowStart = new Date(row.window_started_at);
  if (now.getTime() - windowStart.getTime() > RESET_WINDOW_MS) {
    return { allowed: true };
  }

  if (row.attempt_count >= MAX_RESET_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (windowStart.getTime() + RESET_WINDOW_MS - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true };
}

export async function recordPasswordResetRequest(email: string): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const key = resetBucketKey(email);
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
  const windowExpired = now.getTime() - windowStart.getTime() > RESET_WINDOW_MS;
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

export async function checkSignupRateLimit(ip: string): Promise<RateLimitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { allowed: true };
  }

  const supabase = createServiceClient();
  const key = signupBucketKey(ip);
  const now = new Date();

  const { data: row } = await supabase
    .from("auth_rate_limits")
    .select("*")
    .eq("bucket_key", key)
    .maybeSingle();

  if (!row) return { allowed: true };

  const windowStart = new Date(row.window_started_at);
  if (now.getTime() - windowStart.getTime() > SIGNUP_WINDOW_MS) {
    return { allowed: true };
  }

  if (row.attempt_count >= MAX_SIGNUPS_PER_IP) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (windowStart.getTime() + SIGNUP_WINDOW_MS - now.getTime()) / 1000,
      ),
    };
  }

  return { allowed: true };
}

export async function recordSignupAttempt(ip: string): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createServiceClient();
  const key = signupBucketKey(ip);
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
  const windowExpired = now.getTime() - windowStart.getTime() > SIGNUP_WINDOW_MS;
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
