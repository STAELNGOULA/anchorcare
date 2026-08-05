import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  Home,
  Layers,
  UserCog,
  Users,
} from "lucide-react";

export type DirectorNavKey =
  | "home"
  | "programs"
  | "families"
  | "team"
  | "reports"
  | "insights";

export type DirectorNavItem = {
  key: DirectorNavKey;
  href: string;
  icon: LucideIcon;
};

/** Option C — six primary director tabs; Settings + Shop live in org bar */
export const DIRECTOR_NAV: DirectorNavItem[] = [
  { key: "home", href: "/business/dashboard", icon: Home },
  { key: "programs", href: "/business/programs", icon: Layers },
  { key: "families", href: "/business/families", icon: Users },
  { key: "team", href: "/business/team", icon: UserCog },
  { key: "reports", href: "/business/reports", icon: FileText },
  { key: "insights", href: "/business/insights", icon: BarChart3 },
];

export function isDirectorNavActive(pathname: string, href: string): boolean {
  if (href === "/business/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
