import type { Json } from "@/types/supabase";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function webhookEventsTable(service: ReturnType<typeof createServiceClient>): any {
  return service.from("stripe_webhook_events" as "profiles");
}

export type WebhookRecordResult = "new" | "duplicate";

export async function recordStripeWebhookEvent(input: {
  stripeEventId: string;
  eventType: string;
  payload: unknown;
}): Promise<WebhookRecordResult> {
  const service = createServiceClient();
  const { error } = await webhookEventsTable(service).insert({
    stripe_event_id: input.stripeEventId,
    event_type: input.eventType,
    payload: input.payload as Json,
  });

  if (error?.code === "23505") return "duplicate";
  if (error) throw error;
  return "new";
}
