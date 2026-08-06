"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FamilyAddChildButton } from "@/components/parent/family-add-child-button";
import { FamilyChildrenProvider } from "@/components/parent/family-children-context";
import { FamilySubnav } from "@/components/parent/family-subnav";

type FamilyShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function FamilyShell({ title, subtitle, children }: FamilyShellProps) {
  return (
    <FamilyChildrenProvider>
      <div className="space-y-8">
        <PageHeader title={title} subtitle={subtitle} className="sm:items-start">
          <div className="sm:pt-1.5">
            <FamilyAddChildButton />
          </div>
        </PageHeader>
        <FamilySubnav />
        {children}
      </div>
    </FamilyChildrenProvider>
  );
}
