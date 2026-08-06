import { computeProfileCompletion } from "@/lib/business/org-profile-validation";
import { getOrgProfileForDirector } from "@/lib/business/org-profile-service";
import type {
  SettingsHubGroup,
  SettingsHubHints,
} from "@/lib/settings/settings-hub-types";

export const BUSINESS_SETTINGS_GROUPS: readonly SettingsHubGroup[] = [
  {
    key: "account",
    sections: [{ key: "profile", href: "/business/settings/profile", hintKey: "profile" }],
  },
  {
    key: "organization",
    sections: [
      { key: "staff", href: "/business/team" },
      { key: "invites", href: "/business/settings/invites" },
    ],
  },
  {
    key: "billing",
    sections: [
      { key: "billing", href: "/business/settings/billing" },
      { key: "analytics", href: "/business/insights" },
    ],
  },
  {
    key: "notifications",
    sections: [
      {
        key: "digest",
        href: "/business/settings/digest",
        badge: "p15",
        locked: true,
      },
    ],
  },
  {
    key: "legal",
    sections: [
      {
        key: "marketplace",
        href: "/business/settings/marketplace",
      },
      {
        key: "compliance",
        href: "/business/settings/compliance",
      },
    ],
  },
] as const;

export async function getBusinessSettingsHubHints(
  directorId: string,
): Promise<SettingsHubHints> {
  const profile = await getOrgProfileForDirector(directorId);
  if (!profile) return {};

  const completion = computeProfileCompletion(profile);
  if (completion < 100) {
    return { profile: "profileIncomplete" };
  }

  return {};
}
