import type { Json } from "@/types/supabase";
import { createServiceClient } from "@/lib/supabase/service";
import { childLogger } from "@/lib/logging/logger";

export type AuthAuditEvent =
  | "login_success"
  | "login_fail"
  | "oauth_success"
  | "oauth_fail"
  | "password_reset_requested"
  | "password_reset_completed"
  | "signup_success"
  | "signup_fail";

type AuditInput = {
  eventType: AuthAuditEvent;
  userId?: string | null;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export async function logAuthEvent(input: AuditInput): Promise<void> {
  const log = childLogger({});

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log.debug({ event: input.eventType }, "auth audit (dev noop)");
    return;
  }

  try {
    const supabase = createServiceClient();
    await supabase.from("auth_audit_log").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      email: input.email ?? null,
      ip_address: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch (err) {
    log.warn({ err, event: input.eventType }, "auth audit write failed");
  }
}
