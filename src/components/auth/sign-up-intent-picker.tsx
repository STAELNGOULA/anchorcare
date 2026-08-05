import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type SignUpIntentPickerProps = {
  className?: string;
};

export async function SignUpIntentPicker({ className }: SignUpIntentPickerProps) {
  const t = await getTranslations("auth");

  const options = [
    {
      href: "/sign-up?intent=parent",
      title: t("intentParentTitle"),
      body: t("intentParentBody"),
      cta: t("intentParentCta"),
    },
    {
      href: "/sign-up?intent=program",
      title: t("intentProgramTitle"),
      body: t("intentProgramBody"),
      cta: t("intentProgramCta"),
    },
  ];

  return (
    <div className={cn("grid gap-4", className)}>
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          className="group rounded-[1.25rem] bg-secondary/40 p-5 ring-1 ring-border/50 transition-[background-color,box-shadow] duration-300 ease-premium hover:bg-secondary/60 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h2 className="font-display text-xl text-foreground">{option.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {option.body}
          </p>
          <span className="mt-4 inline-flex text-sm font-medium text-primary group-hover:text-primary/80">
            {option.cta} →
          </span>
        </Link>
      ))}
      <p className="pt-2 text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
