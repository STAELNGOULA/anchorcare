"use client";

import { useEffect } from "react";
import { useFamilyChildren } from "@/components/parent/family-children-context";
import type { ChildListItem } from "@/lib/parent/child-types";

type FamilyChildrenDataProps = {
  children: ChildListItem[];
};

/** Syncs server-fetched children into family context for header wizard + siblings copy. */
export function FamilyChildrenData({ children }: FamilyChildrenDataProps) {
  const { setSiblings } = useFamilyChildren();

  useEffect(() => {
    setSiblings(children);
  }, [children, setSiblings]);

  return null;
}
