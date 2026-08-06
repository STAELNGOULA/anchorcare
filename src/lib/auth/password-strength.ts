import zxcvbn from "zxcvbn";

export const MIN_PASSWORD_SCORE = 2;

export type PasswordStrengthLabel = "weak" | "fair" | "good" | "strong";

export function getPasswordScore(password: string): number {
  if (!password) return 0;
  return zxcvbn(password).score;
}

export function isPasswordStrongEnough(password: string): boolean {
  return getPasswordScore(password) >= MIN_PASSWORD_SCORE;
}

export function getPasswordStrengthLabel(score: number): PasswordStrengthLabel {
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  return "strong";
}

export function getPasswordStrengthPercent(score: number): number {
  return Math.min(100, Math.max(0, ((score + 1) / 5) * 100));
}
