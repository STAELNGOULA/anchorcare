import { CoachShell } from "@/components/coach/coach-shell";
import { getCoachContext } from "@/lib/coach/coach-context";

export default async function CoachAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCoachContext();

  return <CoachShell context={context}>{children}</CoachShell>;
}
