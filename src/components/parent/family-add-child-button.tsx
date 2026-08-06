"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { AddChildWizard } from "@/components/parent/children/add-child-wizard";
import { useFamilyChildrenOptional } from "@/components/parent/family-children-context";
import { Button } from "@/components/ui/button";

export function FamilyAddChildButton() {
  const t = useTranslations("parent.family.children");
  const pathname = usePathname();
  const ctx = useFamilyChildrenOptional();

  const onChildrenSection =
    pathname === "/parent/family/children" ||
    pathname.startsWith("/parent/family/children/");

  if (!onChildrenSection || !ctx) return null;

  const { siblings, wizardOpen, setWizardOpen, openWizard } = ctx;

  return (
    <>
      <Button
        type="button"
        className="rounded-full"
        onClick={openWizard}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden />
        {t("addChild")}
      </Button>
      <AddChildWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        siblings={siblings}
      />
    </>
  );
}
