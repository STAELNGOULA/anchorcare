import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin/admin-context";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminContext();

  return <AdminShell context={context}>{children}</AdminShell>;
}
