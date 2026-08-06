import { describe, expect, it } from "vitest";
import {
  getPasswordScore,
  getPasswordStrengthLabel,
  getPasswordStrengthPercent,
  isPasswordStrongEnough,
  MIN_PASSWORD_SCORE,
} from "./password-strength";

describe("password-strength", () => {
  it("requires zxcvbn score >= 2", () => {
    expect(MIN_PASSWORD_SCORE).toBe(2);
    expect(isPasswordStrongEnough("password")).toBe(false);
    expect(isPasswordStrongEnough("anchor-care-2026!")).toBe(true);
  });

  it("maps scores to labels", () => {
    expect(getPasswordStrengthLabel(0)).toBe("weak");
    expect(getPasswordStrengthLabel(2)).toBe("fair");
    expect(getPasswordStrengthLabel(3)).toBe("good");
    expect(getPasswordStrengthLabel(4)).toBe("strong");
  });

  it("returns percent width for meter", () => {
    expect(getPasswordStrengthPercent(0)).toBeGreaterThan(0);
    expect(getPasswordStrengthPercent(4)).toBe(100);
    expect(getPasswordScore("")).toBe(0);
  });
});
