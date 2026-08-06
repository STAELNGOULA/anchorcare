"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChildListItem } from "@/lib/parent/child-types";

type FamilyChildrenContextValue = {
  siblings: ChildListItem[];
  setSiblings: (children: ChildListItem[]) => void;
  wizardOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
  setWizardOpen: (open: boolean) => void;
};

const FamilyChildrenContext = createContext<FamilyChildrenContextValue | null>(
  null,
);

export function FamilyChildrenProvider({ children }: { children: ReactNode }) {
  const [siblings, setSiblings] = useState<ChildListItem[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const openWizard = useCallback(() => setWizardOpen(true), []);
  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const value = useMemo(
    () => ({
      siblings,
      setSiblings,
      wizardOpen,
      openWizard,
      closeWizard,
      setWizardOpen,
    }),
    [siblings, wizardOpen, openWizard, closeWizard],
  );

  return (
    <FamilyChildrenContext.Provider value={value}>
      {children}
    </FamilyChildrenContext.Provider>
  );
}

export function useFamilyChildren() {
  const ctx = useContext(FamilyChildrenContext);
  if (!ctx) {
    throw new Error("useFamilyChildren must be used within FamilyChildrenProvider");
  }
  return ctx;
}

export function useFamilyChildrenOptional() {
  return useContext(FamilyChildrenContext);
}
