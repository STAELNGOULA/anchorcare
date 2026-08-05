import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Home,
  Layers,
  Settings,
  Users,
} from "lucide-react";

export type DirectorNavKey =
  | "home"
  | "programs"
  | "people"
  | "reports"
  | "settings";

export type DirectorNavItem = {
  key: DirectorNavKey;
  href: string;
  icon: LucideIcon;
};

export const DIRECTOR_NAV: DirectorNavItem[] = [
  { key: "home", href: "/business/dashboard", icon: Home },
  { key: "programs", href: "/business/programs", icon: Layers },
  { key: "people", href: "/business/people", icon: Users },
  { key: "reports", href: "/business/reports", icon: FileText },
  { key: "settings", href: "/business/settings", icon: Settings },
];

export function isDirectorNavActive(pathname: string, href: string): boolean {
  if (href === "/business/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
