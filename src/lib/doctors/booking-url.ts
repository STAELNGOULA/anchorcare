export function buildBookingUrl(baseUrl: string, notes?: string | null): string {
  const trimmed = notes?.trim();
  if (!trimmed) return baseUrl;

  try {
    const url = new URL(baseUrl);
    if (!url.searchParams.has("notes") && !url.searchParams.has("comment")) {
      url.searchParams.set("notes", trimmed);
    }
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}notes=${encodeURIComponent(trimmed)}`;
  }
}

export function isValidBookingUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
