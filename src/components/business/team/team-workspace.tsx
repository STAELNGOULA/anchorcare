"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Mail, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/business/page-header";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type {
  PendingCoachInvite,
  TeamMemberItem,
  TeamProgramOption,
} from "@/lib/business/team-types";
import { cn } from "@/lib/utils";

type TeamWorkspaceProps = {
  members: TeamMemberItem[];
  pendingInvites: PendingCoachInvite[];
  programs: TeamProgramOption[];
};

export function TeamWorkspace({
  members,
  pendingInvites: pending,
  programs,
}: TeamWorkspaceProps) {
  const t = useTranslations("business.team");
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [assignAll, setAssignAll] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleProgram = (id: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const sendInvite = useCallback(async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/business/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          programIds: selectedPrograms,
          assignAllPrograms: assignAll,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        inviteUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(t(`errors.${data.error ?? "invite_failed"}`));
        return;
      }
      toast.success(t("inviteSent"));
      setInviteOpen(false);
      setEmail("");
      setSelectedPrograms([]);
      setAssignAll(false);
      router.refresh();
    } catch {
      toast.error(t("errors.invite_failed"));
    } finally {
      setSubmitting(false);
    }
  }, [assignAll, email, router, selectedPrograms, t]);

  const updateMember = async (
    userId: string,
    input: { isActive: boolean; programIds: string[]; assignAllPrograms: boolean },
  ) => {
    const res = await fetch(`/api/business/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      toast.error(t(`errors.${data.error ?? "update_failed"}`));
      return;
    }
    toast.success(input.isActive ? t("memberUpdated") : t("memberDeactivated"));
    router.refresh();
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <Button
          type="button"
          className="min-h-11 shrink-0"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="mr-2 size-4" aria-hidden />
          {t("inviteCta")}
        </Button>
      </div>

      {inviteOpen ? (
        <div className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
          <h2 className="font-display text-lg text-foreground">{t("inviteTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("inviteSubtitle")}</p>
          <div className="mt-4 space-y-4">
            <TextField
              id="coach-invite-email"
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-secondary/40 px-4 py-3">
              <input
                type="checkbox"
                checked={assignAll}
                onChange={(e) => setAssignAll(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{t("assignAllPrograms")}</span>
            </label>
            {!assignAll ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("programs")}</p>
                <div className="flex flex-wrap gap-2">
                  {programs.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => toggleProgram(program.id)}
                      className={cn(
                        "min-h-9 rounded-full px-4 py-1.5 text-sm transition-[background-color,transform] duration-[220ms] ease-out active:scale-[0.98]",
                        selectedPrograms.includes(program.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/70 text-foreground hover:bg-secondary",
                      )}
                    >
                      {program.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                onClick={() => setInviteOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={submitting || !email.trim()}
                onClick={() => void sendInvite()}
              >
                {submitting ? t("sending") : t("sendInvite")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("pendingTitle")}
          </h2>
          <ul className="divide-y divide-border/40 overflow-hidden rounded-[1.25rem] bg-card ring-1 ring-border/50">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("expires", {
                        date: new Date(invite.expiresAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                </div>
                {invite.inviteUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-9"
                    onClick={() => void copyLink(invite.inviteUrl!)}
                  >
                    <Copy className="mr-2 size-3.5" aria-hidden />
                    {t("copyLink")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {members.length === 0 && pending.length === 0 ? (
        <div className="rounded-[1.25rem] bg-card p-10 text-center ring-1 ring-border/50">
          <Users className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 font-display text-lg text-foreground">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("activeTitle")}
          </h2>
          <ul className="space-y-3">
            {members.map((member) => (
              <TeamMemberCard
                key={member.userId}
                member={member}
                programs={programs}
                onUpdate={updateMember}
                t={t}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TeamMemberCard({
  member,
  programs,
  onUpdate,
  t,
}: {
  member: TeamMemberItem;
  programs: TeamProgramOption[];
  onUpdate: (
    userId: string,
    input: { isActive: boolean; programIds: string[]; assignAllPrograms: boolean },
  ) => Promise<void>;
  t: ReturnType<typeof useTranslations<"business.team">>;
}) {
  const [editing, setEditing] = useState(false);
  const [assignAll, setAssignAll] = useState(false);
  const [selected, setSelected] = useState<string[]>(member.programIds);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <li
      className={cn(
        "rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 transition-[opacity] duration-[220ms]",
        !member.isActive && "opacity-60",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{member.fullName}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {member.isActive
              ? member.programNames.length > 0
                ? member.programNames.join(" · ")
                : t("noPrograms")
              : t("deactivatedLabel")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {member.isActive ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-9"
                onClick={() => setEditing((v) => !v)}
              >
                {t("editPrograms")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9 text-destructive hover:text-destructive"
                onClick={() => void onUpdate(member.userId, {
                  isActive: false,
                  programIds: [],
                  assignAllPrograms: false,
                })}
              >
                {t("deactivate")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={() => void onUpdate(member.userId, {
                isActive: true,
                programIds: member.programIds,
                assignAllPrograms: false,
              })}
            >
              {t("reactivate")}
            </Button>
          )}
        </div>
      </div>

      {editing && member.isActive ? (
        <div className="mt-4 border-t border-border/40 pt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={assignAll}
              onChange={(e) => setAssignAll(e.target.checked)}
              className="size-4"
            />
            {t("assignAllPrograms")}
          </label>
          {!assignAll ? (
            <div className="flex flex-wrap gap-2">
              {programs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "min-h-9 rounded-full px-3 py-1 text-sm transition-[background-color] duration-[220ms]",
                    selected.includes(p.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/70",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="min-h-9"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onUpdate(member.userId, {
                isActive: true,
                programIds: selected,
                assignAllPrograms: assignAll,
              });
              setSaving(false);
              setEditing(false);
            }}
          >
            {saving ? t("saving") : t("savePrograms")}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
