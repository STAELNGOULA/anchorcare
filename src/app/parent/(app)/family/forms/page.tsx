import type { Metadata } from "next";
import { FamilyTabPage, familyTabMetadata } from "@/components/parent/family-tab-page";

export async function generateMetadata(): Promise<Metadata> {
  return familyTabMetadata("forms");
}

export default function Page() {
  return <FamilyTabPage tab="forms" />;
}
