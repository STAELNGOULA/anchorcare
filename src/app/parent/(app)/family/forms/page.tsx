import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentFormsWorkspace } from "@/components/parent/forms/parent-forms-workspace";
import { listParentForms } from "@/lib/forms/form-service";
import { getParentContext } from "@/lib/parent/parent-context";
import { listChildrenForParent } from "@/lib/parent/children-service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.family.forms");
  return { title: t("metaTitle") };
}

export default async function Page() {
  const context = await getParentContext();
  const [forms, children] = await Promise.all([
    listParentForms(context.userId),
    listChildrenForParent(context.userId),
  ]);

  return (
    <ParentFormsWorkspace
      initialForms={forms}
      children={children.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
      }))}
    />
  );
}
