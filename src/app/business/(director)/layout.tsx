import { DirectorShell } from "@/components/business/director-shell";
import { getDirectorContext } from "@/lib/business/director-context";

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getDirectorContext();

  return <DirectorShell context={context}>{children}</DirectorShell>;
}
