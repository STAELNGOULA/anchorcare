import { describe, expect, it } from "vitest";
import { resolveSmartCta } from "@/lib/public/smart-cta";

  const base = {
  priceAmountCents: 45000,
  registrationOpen: true,
  spotsRemaining: 3,
  waitlistEnabled: false,
  paymentsConfigured: true,
};

describe("resolveSmartCta", () => {
  it("returns closed when registration window is closed", () => {
    expect(resolveSmartCta({ ...base, registrationOpen: false }).kind).toBe("closed");
  });

  it("returns payments_unavailable for paid programs without Connect", () => {
    expect(
      resolveSmartCta({ ...base, paymentsConfigured: false }).kind,
    ).toBe("payments_unavailable");
  });

  it("returns free_enroll for zero-price programs", () => {
    expect(
      resolveSmartCta({ ...base, priceAmountCents: 0 }).kind,
    ).toBe("free_enroll");
  });

  it("returns waitlist when full and waitlist enabled", () => {
    expect(
      resolveSmartCta({ ...base, spotsRemaining: 0, waitlistEnabled: true }).kind,
    ).toBe("waitlist");
  });

  it("returns book_pay for paid open programs", () => {
    expect(resolveSmartCta(base).kind).toBe("book_pay");
  });
});
