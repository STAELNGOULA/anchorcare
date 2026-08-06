"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CoachInviteAcceptProps = {
  token: string;
  userEmail: string;
};

export function CoachInviteAccept({ token, userEmail }: CoachInviteAcceptProps) {
  const t = useTranslations("auth.inviteFlow");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setPulse(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const accept = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok || !data.ok) {
        setError(tAuth((data.error ?? "inviteAcceptFailed") as "inviteAcceptFailed"));
        return;
      }
      toast.success(t("coachAcceptSuccess"));
      router.push(data.redirectTo ?? "/coach/programs");
      router.refresh();
    } catch {
      setError(tAuth("inviteAcceptFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("coachSignedInAs", { email: userEmail })}
      </p>
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      ) : null}
      <Button
        type="button"
        className={cn(
          "w-full rounded-full",
          pulse && "motion-safe:animate-[pulse_1s_ease-out_1]",
        )}
        disabled={pending}
        onClick={() => void accept()}
      >
        {pending ? t("accepting") : t("coachAcceptCta")}
      </Button>
    </div>
  );
}
