import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Clock3,
  HeartPulse,
  Layers,
  UserCircle,
  Users,
} from "lucide-react";

export type ParentNavKey =
  | "today"
  | "timeline"
  | "family"
  | "programs"
  | "care"
  | "you";

export type ParentNavItem = {
  key: ParentNavKey;
  href: string;
  icon: LucideIcon;
};

/** Option C — frequency-first six-slot parent IA */
export const PARENT_NAV: ParentNavItem[] = [
  { key: "today", href: "/parent/today", icon: CalendarDays },
  { key: "timeline", href: "/parent/timeline", icon: Clock3 },
  { key: "family", href: "/parent/family", icon: Users },
  { key: "programs", href: "/parent/programs", icon: Layers },
  { key: "care", href: "/parent/care", icon: HeartPulse },
  { key: "you", href: "/parent/you", icon: UserCircle },
];

export function isParentNavActive(pathname: string, href: string): boolean {
  if (href === "/parent/today") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
