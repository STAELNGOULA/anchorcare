"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export function ResetExpiredState() {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col items-center gap-6 py-2 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10"
        aria-hidden
      >
        <Clock className="h-7 w-7 text-destructive" strokeWidth={1.75} />
      </div>
      <Button asChild className="w-full rounded-full">
        <Link href="/forgot-password">{t("requestNewLink")}</Link>
      </Button>
    </div>
  );
}
