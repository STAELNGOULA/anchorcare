import { ParentShell } from "@/components/parent/parent-shell";
import { getParentContext } from "@/lib/parent/parent-context";

export default async function ParentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getParentContext();

  return <ParentShell context={context}>{children}</ParentShell>;
}
