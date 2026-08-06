import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { ChildrenListClient } from "@/components/parent/children/children-list-client";

import { FamilyChildrenData } from "@/components/parent/family-children-data";

import { listChildrenForParent } from "@/lib/parent/children-service";

import { getParentContext } from "@/lib/parent/parent-context";



export async function generateMetadata(): Promise<Metadata> {

  const t = await getTranslations("parent.family.children");

  return { title: t("metaTitle") };

}



export default async function ParentChildrenPage() {

  const context = await getParentContext();

  const children = await listChildrenForParent(context.userId);



  return (

    <>

      <FamilyChildrenData children={children} />

      <ChildrenListClient children={children} />

    </>

  );

}

