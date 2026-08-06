"use client";



import { useTranslations } from "next-intl";

import { ChildListCard } from "@/components/parent/children/child-list-card";

import { EmptyState } from "@/components/shared/empty-state";

import { useFamilyChildren } from "@/components/parent/family-children-context";

import type { ChildListItem } from "@/lib/parent/child-types";



type ChildrenListClientProps = {

  children: ChildListItem[];

};



export function ChildrenListClient({ children }: ChildrenListClientProps) {

  const t = useTranslations("parent.family.children");

  const { openWizard } = useFamilyChildren();



  if (children.length === 0) {

    return (

      <EmptyState

        title={t("emptyTitle")}

        description={t("emptyBody")}

        actionLabel={t("addChild")}

        onAction={openWizard}

      />

    );

  }



  return (

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

      {children.map((child) => (

        <ChildListCard key={child.id} child={child} />

      ))}

    </div>

  );

}

