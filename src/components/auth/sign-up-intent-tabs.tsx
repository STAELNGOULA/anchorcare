import Link from "next/link";
import { cn } from "@/lib/utils";

type SignUpIntentTabsProps = {
  active: "parent" | "program";
  parentLabel: string;
  programLabel: string;
  inviteToken?: string;
  className?: string;
};

export function SignUpIntentTabs({
  active,
  parentLabel,
  programLabel,
  inviteToken,
  className,
}: SignUpIntentTabsProps) {
  const inviteQuery = inviteToken ? `&invite=${inviteToken}` : "";

  const tabs = [
    {
      id: "parent" as const,
      href: `/sign-up?intent=parent${inviteQuery}`,
      label: parentLabel,
    },
    {
      id: "program" as const,
      href: `/sign-up?intent=program${inviteQuery}`,
      label: programLabel,
    },
  ];

  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-2 gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/40",
        className,
      )}
      role="tablist"
      aria-label="Account type"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.id}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center text-sm font-medium transition-colors duration-300 ease-premium",
            active === tab.id
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
