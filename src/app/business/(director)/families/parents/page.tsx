import type { Metadata } from "next";
import {
  FamiliesTabPage,
  familiesTabMetadata,
} from "@/components/business/families-tab-page";

export async function generateMetadata(): Promise<Metadata> {
  return familiesTabMetadata("parents");
}

export default function BusinessFamiliesParentsPage() {
  return <FamiliesTabPage tab="parents" />;
}
