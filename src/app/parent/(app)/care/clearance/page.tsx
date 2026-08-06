import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClearanceShareWorkspace } from "@/components/clearance/clearance-share-workspace";
import {
  listParentClearanceEnrollments,
  listParentClearanceHistory,
} from "@/lib/clearance/clearance-share-service";
import { getParentContext } from "@/lib/parent/parent-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.care.clearance");
  return { title: t("metaTitle") };
}

export default async function ParentClearancePage() {
  const { userId } = await getParentContext();
  const [enrollments, history] = await Promise.all([
    listParentClearanceEnrollments(userId),
    listParentClearanceHistory(userId),
  ]);

  return (
    <ClearanceShareWorkspace enrollments={enrollments} history={history} />
  );
}
