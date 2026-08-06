import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProgramDiscoverWorkspace } from "@/components/parent/discovery/program-discover-workspace";
import { ProgramsSubnav } from "@/components/parent/programs-subnav";
import {
  getDiscoveryCities,
  listDiscoveryOrgs,
} from "@/lib/discovery/discovery-service";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.programs.discover");
  return { title: t("metaTitle") };
}

export default async function ParentProgramsDiscoverPage() {
  const [cities, orgs] = await Promise.all([getDiscoveryCities(), listDiscoveryOrgs()]);

  return (
    <div className="space-y-8">
      <ProgramsSubnav />
      <ProgramDiscoverWorkspace cities={cities} initialOrgs={orgs} />
    </div>
  );
}
