import type { StaffEmergencyNavItem } from "@/lib/emergency/types";

export function toNavItems(
  items: { registrationId: string; firstName: string; lastName: string }[],
): StaffEmergencyNavItem[] {
  return items.map((item) => ({
    registrationId: item.registrationId,
    firstName: item.firstName,
    lastName: item.lastName,
  }));
}
