import { describe, expect, it } from "vitest";
import { canEnablePublicListing } from "@/lib/business/program-validation";
import {
  computeSpotsRemaining,
  isRegistrationWindowOpen,
} from "@/lib/business/program-public";

describe("canEnablePublicListing", () => {
  it("requires headline and schedule", () => {
    expect(
      canEnablePublicListing({
        priceAmountCents: 0,
        stripeConnectOnboarded: true,
        publicHeadline: null,
        scheduleSummary: "Mon–Fri 9am",
      }),
    ).toEqual({ ok: false, reason: "headlineRequired" });

    expect(
      canEnablePublicListing({
        priceAmountCents: 0,
        stripeConnectOnboarded: true,
        publicHeadline: "Summer camp",
        scheduleSummary: null,
      }),
    ).toEqual({ ok: false, reason: "scheduleRequired" });
  });

  it("blocks paid listing without Stripe Connect", () => {
    expect(
      canEnablePublicListing({
        priceAmountCents: 45000,
        stripeConnectOnboarded: false,
        publicHeadline: "Summer camp",
        scheduleSummary: "Mon–Fri 9am",
      }),
    ).toEqual({ ok: false, reason: "connectRequired" });
  });

  it("allows free public listing without Connect", () => {
    expect(
      canEnablePublicListing({
        priceAmountCents: 0,
        stripeConnectOnboarded: false,
        publicHeadline: "Open house",
        scheduleSummary: "Saturday 10am",
      }),
    ).toEqual({ ok: true });
  });
});

describe("isRegistrationWindowOpen", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");

  it("respects open and close boundaries", () => {
    expect(
      isRegistrationWindowOpen(
        "2026-08-06T00:00:00.000Z",
        null,
        now,
      ),
    ).toBe(false);

    expect(
      isRegistrationWindowOpen(
        "2026-08-01T00:00:00.000Z",
        "2026-08-04T00:00:00.000Z",
        now,
      ),
    ).toBe(false);

    expect(
      isRegistrationWindowOpen(
        "2026-08-01T00:00:00.000Z",
        "2026-08-10T00:00:00.000Z",
        now,
      ),
    ).toBe(true);
  });
});

describe("computeSpotsRemaining", () => {
  it("never returns negative spots", () => {
    expect(computeSpotsRemaining(10, 12)).toBe(0);
    expect(computeSpotsRemaining(null, 5)).toBeNull();
    expect(computeSpotsRemaining(10, 3)).toBe(7);
  });
});
