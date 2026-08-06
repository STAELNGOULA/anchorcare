"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Mail, UserPlus, X } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  CoparentChildState,
  CoparentWorkspaceData,
  GuardianPermission,
} from "@/lib/coparent/coparent-types";

type CoparentWorkspaceProps = {
  initialData: CoparentWorkspaceData;
};

export function CoparentWorkspace({ initialData }: CoparentWorkspaceProps) {
  const t = useTranslations("parent.family.coparent");
  const [data, setData] = useState(initialData);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<CoparentChildState | null>(
    data.children[0] ?? null,
  );
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<GuardianPermission>("view");
  const [pending, setPending] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/parent/coparent", { credentials: "include" });
    const body = (await res.json()) as { data?: CoparentWorkspaceData };
    if (res.ok && body.data) setData(body.data);
  };

  const sendInvite = async () => {
    if (!selectedChild || !email.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/parent/coparent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childId: selectedChild.childId,
          inviteEmail: email.trim(),
          permission,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        inviteUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        const key =
          body.error === "alreadyInvited"
            ? "errors.alreadyInvited"
            : body.error === "selfInvite"
              ? "errors.selfInvite"
              : "errors.inviteFailed";
        toast.error(t(key));
        return;
      }
      toast.success(t("inviteSent"));
      setLastInviteUrl(body.inviteUrl ?? null);
      setEmail("");
      await reload();
    } catch {
      toast.error(t("errors.inviteFailed"));
    } finally {
      setPending(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/parent/coparent?inviteId=${encodeURIComponent(inviteId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error(t("errors.revokeFailed"));
        return;
      }
      toast.success(t("inviteRevoked"));
      await reload();
    } catch {
      toast.error(t("errors.revokeFailed"));
    } finally {
      setPending(false);
    }
  };

  const revokeGuardian = async (guardianId: string) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/parent/coparent?guardianId=${encodeURIComponent(guardianId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error(t("errors.revokeFailed"));
        return;
      }
      toast.success(t("accessRevoked"));
      await reload();
    } catch {
      toast.error(t("errors.revokeFailed"));
    } finally {
      setPending(false);
    }
  };

  if (data.children.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actionHref="/parent/family/children"
        actionLabel={t("emptyCta")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          type="button"
          className="min-h-11"
          onClick={() => {
            setSelectedChild(data.children[0] ?? null);
            setInviteOpen(true);
          }}
        >
          <UserPlus className="mr-2 size-4" aria-hidden />
          {t("inviteCta")}
        </Button>
      </div>

      {data.children.map((child) => (
        <BezelCard key={child.childId} className="space-y-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-foreground">
              {child.firstName} {child.lastName}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedChild(child);
                setInviteOpen(true);
              }}
            >
              {t("inviteForChild")}
            </Button>
          </div>

          {child.guardians.length === 0 && child.pendingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAccessYet")}</p>
          ) : null}

          {child.guardians.length > 0 ? (
            <ul className="space-y-2">
              {child.guardians.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {g.guardianName || g.guardianEmail || t("unknownGuardian")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(`permissions.${g.permission}`)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void revokeGuardian(g.id)}
                    disabled={pending}
                    aria-label={t("revoke")}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {child.pendingInvites.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("pendingInvites")}
              </p>
              <ul className="space-y-2">
                {child.pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{invite.inviteEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`permissions.${invite.permission}`)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void revokeInvite(invite.id)}
                      disabled={pending}
                    >
                      {t("cancelInvite")}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </BezelCard>
      ))}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md rounded-[1.25rem]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("inviteTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {data.children.length > 1 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("childLabel")}</label>
                <select
                  value={selectedChild?.childId ?? ""}
                  onChange={(e) => {
                    const child = data.children.find((c) => c.childId === e.target.value);
                    setSelectedChild(child ?? null);
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  {data.children.map((c) => (
                    <option key={c.childId} value={c.childId}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <TextField
              id="coparent-invite-email"
              label={t("emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("permissionLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {(["view", "full"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPermission(level)}
                    className={`min-h-11 rounded-full px-4 text-sm transition-[background-color,transform] duration-200 ease-out active:scale-[0.98] ${
                      permission === level
                        ? "bg-foreground text-background"
                        : "bg-card text-muted-foreground ring-1 ring-border/60"
                    }`}
                  >
                    {t(`permissions.${level}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`permissionHint.${permission}`)}
              </p>
            </div>
            {lastInviteUrl ? (
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                <code className="min-w-0 flex-1 truncate text-xs">{lastInviteUrl}</code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(lastInviteUrl);
                    toast.success(t("linkCopied"));
                  }}
                  aria-label={t("copyLink")}
                >
                  <Copy className="size-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void sendInvite()} disabled={pending || !email.trim()}>
              {t("sendInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
