import { describe, expect, it, vi } from "vitest";

const insertMock = vi
  .fn()
  .mockResolvedValueOnce({ error: null })
  .mockResolvedValueOnce({ error: { code: "23505" } });

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: insertMock,
    }),
  }),
}));

describe("recordStripeWebhookEvent", () => {
  it("returns new on first insert and duplicate on conflict", async () => {
    const { recordStripeWebhookEvent } = await import(
      "@/lib/billing/webhook-idempotency"
    );

    const payload = {
      stripeEventId: "evt_test_123",
      eventType: "customer.subscription.updated",
      payload: { id: "evt_test_123" },
    };

    expect(await recordStripeWebhookEvent(payload)).toBe("new");
    expect(await recordStripeWebhookEvent(payload)).toBe("duplicate");
    expect(insertMock).toHaveBeenCalledTimes(2);
  });
});
