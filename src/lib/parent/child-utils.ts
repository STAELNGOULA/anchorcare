export function computeChildAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years -= 1;
  }
  if (years < 1) {
    const months =
      (now.getFullYear() - dob.getFullYear()) * 12 +
      (now.getMonth() - dob.getMonth());
    return months <= 1 ? "1 mo" : `${months} mo`;
  }
  return years === 1 ? "1 yr" : `${years} yr`;
}
