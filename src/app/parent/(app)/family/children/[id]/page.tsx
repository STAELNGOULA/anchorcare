import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ChildDetailClient } from "@/components/parent/children/child-detail-client";
import { getChildForParent } from "@/lib/parent/children-service";
import { getParentContext } from "@/lib/parent/parent-context";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const context = await getParentContext();
  const child = await getChildForParent(context.userId, id);
  const t = await getTranslations("parent.family.children");
  if (!child) return { title: t("metaTitle") };
  return {
    title: `${child.firstName} ${child.lastName}`.trim(),
  };
}

export default async function ParentChildDetailPage({ params }: PageProps) {
  const { id } = await params;
  const context = await getParentContext();
  const child = await getChildForParent(context.userId, id);

  if (!child) notFound();

  return (
    <Suspense fallback={null}>
      <ChildDetailClient child={child} />
    </Suspense>
  );
}
