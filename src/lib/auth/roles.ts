export type UserRole = "parent" | "business_admin" | "coach" | "admin";

export const USER_ROLES = [
  "parent",
  "business_admin",
  "coach",
  "admin",
] as const satisfies readonly UserRole[];

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  parent: "/parent/today",
  business_admin: "/business/dashboard",
  coach: "/coach/programs",
  admin: "/admin/dashboard",
};

export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  parent: "/parent",
  business_admin: "/business",
  coach: "/coach",
  admin: "/admin",
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;

  if (role === "business_admin") {
    return (
      pathname.startsWith("/business") ||
      pathname.startsWith("/coach") ||
      pathname.startsWith("/api/business") ||
      pathname.startsWith("/api/coach")
    );
  }

  if (role === "coach") {
    return (
      pathname.startsWith("/coach") || pathname.startsWith("/api/coach")
    );
  }

  if (role === "parent") {
    return (
      pathname.startsWith("/parent") || pathname.startsWith("/api/parent")
    );
  }

  return false;
}
