import { describe, expect, it } from "vitest";
import { isValidPublicSlug, slugifyOrgName, suggestHeadline } from "./slug";

describe("slug", () => {
  it("slugifies org names", () => {
    expect(slugifyOrgName("Sunshine Daycare")).toBe("sunshine-daycare");
    expect(isValidPublicSlug("sunshine-daycare")).toBe(true);
    expect(isValidPublicSlug("ab")).toBe(false);
  });

  it("suggests headline from org name", () => {
    expect(suggestHeadline("Sunshine Daycare")).toContain("Sunshine Daycare");
  });
});
