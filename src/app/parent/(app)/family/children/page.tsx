import type { Metadata } from "next";
import { FamilyTabPage, familyTabMetadata } from "@/components/parent/family-tab-page";

export async function generateMetadata(): Promise<Metadata> {
  return familyTabMetadata("children");
}

export default function Page() {
  return <FamilyTabPage tab="children" />;
}
