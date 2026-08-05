import { getTranslations } from "next-intl/server";
import { BezelCard } from "@/components/marketing/bezel-card";

type SectionEmptyProps = {
  title: string;
  body: string;
};

export async function SectionEmpty({ title, body }: SectionEmptyProps) {
  return (
    <BezelCard className="flex flex-col items-start gap-4 p-8 md:p-10">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </BezelCard>
  );
}

type AdminEmptyNamespace =
  | "doctors"
  | "consults"
  | "users"
  | "businesses"
  | "analytics";

export async function AdminSectionEmptyFromKey({
  namespace,
}: {
  namespace: AdminEmptyNamespace;
}) {
  const t = await getTranslations(`admin.${namespace}`);

  return (
    <SectionEmpty title={t("emptyTitle")} body={t("emptyBody")} />
  );
}
