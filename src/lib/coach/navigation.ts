import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Layers,
  Mic,
  Users,
} from "lucide-react";

export type CoachNavKey = "programs" | "report" | "roster" | "incidents";

export type CoachNavItem = {
  key: CoachNavKey;
  href: string;
  icon: LucideIcon;
};

export const COACH_NAV: CoachNavItem[] = [
  { key: "programs", href: "/coach/programs", icon: Layers },
  { key: "report", href: "/coach/report", icon: Mic },
  { key: "roster", href: "/coach/roster", icon: Users },
  { key: "incidents", href: "/coach/incidents", icon: AlertTriangle },
];

export function isCoachNavActive(pathname: string, href: string): boolean {
  if (href === "/coach/programs") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
