import { parseReturnTo } from "@/lib/auth/return-to";
import { describe, expect, it } from "vitest";

describe("parseReturnTo", () => {
  it("classifies public register paths", () => {
    const result = parseReturnTo("/p/demo-camp/programs/summer");
    expect(result?.intent).toBe("public_register");
    expect(result?.path).toBe("/p/demo-camp/programs/summer");
  });

  it("classifies sms report paths", () => {
    const result = parseReturnTo("/r/abc123token");
    expect(result?.intent).toBe("sms_report");
  });

  it("classifies invite paths", () => {
    const result = parseReturnTo("/invite/some-token");
    expect(result?.intent).toBe("invite");
  });

  it("rejects unsafe paths", () => {
    expect(parseReturnTo("//evil.com")).toBeNull();
    expect(parseReturnTo("/login")).toBeNull();
  });
});
