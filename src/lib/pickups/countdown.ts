export function formatPickupCountdown(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
}
