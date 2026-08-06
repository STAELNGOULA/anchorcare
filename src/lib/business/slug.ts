const SLUG_PATTERN = /^[a-z0-9-]{3,40}$/;

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (base.length >= 3) return base;
  return `program-${Date.now().toString(36).slice(-6)}`;
}

export function isValidPublicSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function suggestHeadline(orgName: string): string {
  const trimmed = orgName.trim();
  if (!trimmed) return "Daily updates families trust.";
  return `Daily updates families trust at ${trimmed}.`;
}
