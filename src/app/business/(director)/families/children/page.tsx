import type { Metadata } from "next";
import {
  FamiliesTabPage,
  familiesTabMetadata,
} from "@/components/business/families-tab-page";

export async function generateMetadata(): Promise<Metadata> {
  return familiesTabMetadata("children");
}

export default function BusinessFamiliesChildrenPage() {
  return <FamiliesTabPage tab="children" />;
}
