import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Headphones,
  LayoutDashboard,
  ShoppingBag,
  Stethoscope,
  Users,
} from "lucide-react";

export type AdminNavKey =
  | "dashboard"
  | "doctors"
  | "consults"
  | "users"
  | "businesses"
  | "marketplace"
  | "analytics";

export type AdminNavItem = {
  key: AdminNavKey;
  href: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "doctors", href: "/admin/doctors", icon: Stethoscope },
  { key: "consults", href: "/admin/consults", icon: Headphones },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "businesses", href: "/admin/businesses", icon: Building2 },
  { key: "marketplace", href: "/admin/marketplace", icon: ShoppingBag },
  { key: "analytics", href: "/admin/analytics", icon: BarChart3 },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
