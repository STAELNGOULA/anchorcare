import { redirect } from "next/navigation";

const PROFILE_TO_FAMILY = ["children", "emergency", "pickups", "forms", "coparent"] as const;
const PROFILE_TO_YOU = ["subscription", "consents", "marketplace", "account", "forms"] as const;

type Props = { params: Promise<{ segment: string }> };

export default async function ParentProfileLegacyRedirect({
  params,
}: Props) {
  const { segment } = await params;
  if ((PROFILE_TO_FAMILY as readonly string[]).includes(segment)) {
    redirect(`/parent/family/${segment}`);
  }
  if ((PROFILE_TO_YOU as readonly string[]).includes(segment)) {
    redirect(`/parent/you/${segment}`);
  }
  redirect("/parent/you");
}
