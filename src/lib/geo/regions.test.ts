import { describe, expect, it } from "vitest";
import { getRegionsForCountry, isValidRegion } from "./regions";

describe("regions", () => {
  it("returns US states", () => {
    expect(getRegionsForCountry("US").length).toBeGreaterThan(40);
    expect(isValidRegion("US", "NY")).toBe(true);
    expect(isValidRegion("US", "XX")).toBe(false);
  });

  it("returns CA provinces", () => {
    expect(getRegionsForCountry("CA").length).toBe(13);
    expect(isValidRegion("CA", "ON")).toBe(true);
    expect(isValidRegion("CA", "NY")).toBe(false);
  });
});
