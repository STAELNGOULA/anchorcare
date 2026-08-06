import { computeHealthScore } from "@/lib/parent/child-health-score";
import { getChildForParent } from "@/lib/parent/children-service";
import type { ParentPlan } from "@/lib/parent/parent-context";
import type {
  SettingsHubGroup,
  SettingsHubHints,
} from "@/lib/settings/settings-hub-types";
import { createClient } from "@/lib/supabase/server";

export const PARENT_YOU_GROUPS: readonly SettingsHubGroup[] = [
  {
    key: "account",
    sections: [
      { key: "account", href: "/parent/you/account" },
      {
        key: "forms",
        href: "/parent/you/forms",
      },
    ],
  },
  {
    key: "family",
    sections: [
      { key: "children", href: "/parent/family/children" },
      { key: "emergency", href: "/parent/family/emergency", hintKey: "emergency" },
      { key: "programs", href: "/parent/programs" },
      {
        key: "coparent",
        href: "/parent/family/coparent",
      },
    ],
  },
  {
    key: "notifications",
    sections: [{ key: "consents", href: "/parent/you/consents" }],
  },
  {
    key: "billing",
    sections: [
      {
        key: "subscription",
        href: "/parent/you/subscription",
        planBadge: "free",
      },
    ],
  },
  {
    key: "legal",
    sections: [
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
      {
        key: "marketplace",
        href: "/parent/you/marketplace",
      },
    ],
  },
] as const;

export function parentYouGroupsForPlan(plan: ParentPlan): SettingsHubGroup[] {
  return PARENT_YOU_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.map((section) =>
      section.key === "subscription"
        ? { ...section, planBadge: plan }
        : section,
    ),
  }));
}

export async function getParentYouHubHints(
  parentId: string,
): Promise<SettingsHubHints> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("children")
    .select("id")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (!rows?.length) return {};

  const profiles = await Promise.all(
    rows.map((row) => getChildForParent(parentId, row.id)),
  );

  const children = profiles.filter((child) => child !== null);
  const hasEnrollment = children.some((child) => child.programs.length > 0);

  const needsEmergencyCard = children.some((child) => {
    const score = computeHealthScore({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      allergyItems: child.allergyItems,
      allergies: child.allergies,
      medications: child.medications,
      medicalConditions: child.medicalConditions,
      emergencyContacts: child.emergencyContacts,
      physicianName: child.physicianName,
      physicianPhone: child.physicianPhone,
      photoUrl: child.photoUrl,
    });
    return score < 80;
  });

  if (hasEnrollment && needsEmergencyCard) {
    return { emergency: "emergencyIncomplete" };
  }

  return {};
}
