"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HealthProfilePreview } from "@/components/invite/health-profile-preview";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { InviteDetail, ParentChildOption } from "@/lib/invites/types";
import { cn } from "@/lib/utils";

type InviteAcceptPanelProps = {
  token: string;
  invite: InviteDetail;
  children: ParentChildOption[];
  userEmail: string;
};

type Mode = "select" | "new";

export function InviteAcceptPanel({
  token,
  invite,
  children,
  userEmail,
}: InviteAcceptPanelProps) {
  const t = useTranslations("auth.inviteFlow");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(children.length ? "select" : "new");
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [newFirstName, setNewFirstName] = useState(invite.childFirstName ?? "");
  const [newLastName, setNewLastName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [copyHealth, setCopyHealth] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setPulse(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const childOptions = useMemo(
    () =>
      children.map((child) => ({
        value: child.id,
        label: `${child.firstName}${child.lastName ? ` ${child.lastName}` : ""}`,
      })),
    [children],
  );

  const selectedChild = children.find((c) => c.id === childId) ?? null;

  const submit = async () => {
    setPending(true);
    setError(null);

    const payload =
      mode === "select"
        ? { childId, copyHealthProfile: copyHealth }
        : {
            newChild: {
              firstName: newFirstName.trim(),
              lastName: newLastName.trim() || undefined,
              dateOfBirth: newDob || undefined,
            },
            copyHealthProfile: copyHealth,
          };

    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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

      toast.success(t("acceptSuccess"));
      router.push(data.redirectTo ?? "/parent/today");
      router.refresh();
    } catch {
      setError(tAuth("inviteAcceptFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t("signedInAs", { email: userEmail })}
      </p>

      {children.length > 0 ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              mode === "select"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t("selectChild")}
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              mode === "new"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t("addChild")}
          </button>
        </div>
      ) : null}

      {mode === "select" && children.length > 0 ? (
        <FormSelectField
          id="childId"
          label={t("childLabel")}
          value={childId}
          onValueChange={setChildId}
          options={childOptions}
          required
        />
      ) : (
        <div className="space-y-4">
          <TextField
            id="newFirstName"
            label={t("childFirstName")}
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            required
          />
          <TextField
            id="newLastName"
            label={t("childLastName")}
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
          />
          <TextField
            id="newDob"
            label={t("childDob")}
            type="date"
            value={newDob}
            onChange={(e) => setNewDob(e.target.value)}
          />
        </div>
      )}

      <HealthProfilePreview child={mode === "select" ? selectedChild : null} />

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={copyHealth}
          onChange={(e) => setCopyHealth(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input"
        />
        <span className="text-muted-foreground">{t("copyHealthProfile")}</span>
      </label>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className={cn(
          "w-full rounded-full transition-transform duration-[var(--motion-micro)] ease-premium active:scale-[0.98]",
          pulse && "motion-safe:animate-[pulse_1s_ease-out_1]",
        )}
        disabled={pending}
        onClick={() => void submit()}
      >
        {pending ? t("accepting") : t("acceptCta")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Link href={`/parent/family/children`} className="text-primary hover:underline">
          {t("editHealthProfile")}
        </Link>
      </p>
    </div>
  );
}
