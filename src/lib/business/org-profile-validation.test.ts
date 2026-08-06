import { describe, expect, it } from "vitest";
import { normalizeHoursJson } from "@/lib/business/org-profile-types";
import { orgProfilePatchSchema } from "@/lib/business/org-profile-validation";

describe("normalizeHoursJson", () => {
  it("fills defaults when DB value is empty object", () => {
    const hours = normalizeHoursJson({});
    expect(hours.mon.open).toBe("08:00");
    expect(hours.sat.closed).toBe(true);
  });
});

describe("orgProfilePatchSchema", () => {
  it("accepts autosave payload with empty hours_json from DB", () => {
    const result = orgProfilePatchSchema.safeParse({
      name: "NexGen FC",
      website: "",
      publicEmail: "",
      hoursJson: {},
      brandAccentColor: "#4ECDC4",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes bare website hostnames", () => {
    const result = orgProfilePatchSchema.safeParse({
      website: "nexgenfc.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe("https://nexgenfc.com");
    }
  });

  it("allows partial public email while drafting", () => {
    const result = orgProfilePatchSchema.safeParse({
      publicEmail: "coach@",
    });
    expect(result.success).toBe(true);
  });
});
