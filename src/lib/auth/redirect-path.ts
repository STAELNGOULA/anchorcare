const DEFAULT_MAX_LENGTH = 512;

export function isValidRedirectPath(path: string, maxLength = DEFAULT_MAX_LENGTH): boolean {
  if (!path || path.length > maxLength) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;

  const blockedPrefixes = [
    "/login",
    "/sign-up",
    "/api",
    "/admin/login",
    "/_next",
  ];

  return !blockedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
