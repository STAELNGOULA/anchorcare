export function isRegistrationWindowOpen(
  opensAt: string | null,
  closesAt: string | null,
  now: Date = new Date(),
): boolean {
  const timestamp = now.getTime();
  if (opensAt && new Date(opensAt).getTime() > timestamp) return false;
  if (closesAt && new Date(closesAt).getTime() < timestamp) return false;
  return true;
}

export function computeSpotsRemaining(
  capacity: number | null,
  enrollmentCount: number,
): number | null {
  if (capacity == null) return null;
  return Math.max(0, capacity - enrollmentCount);
}
