"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Phone, Plus, Trash2, User } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPickupCountdown } from "@/lib/pickups/countdown";
import type { AuthorizedPickup, ParentPickupChild } from "@/lib/pickups/types";
import { cn } from "@/lib/utils";

type ParentPickupsWorkspaceProps = {
  children: ParentPickupChild[];
};

export function ParentPickupsWorkspace({
  children: initialChildren,
}: ParentPickupsWorkspaceProps) {
  const t = useTranslations("parent.family.pickups");
  const [children, setChildren] = useState(initialChildren);
  const [selectedId, setSelectedId] = useState(initialChildren[0]?.childId ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", phone: "" });
  const [overrideForm, setOverrideForm] = useState({
    personName: "",
    note: "",
    untilTime: "",
    authorizedPickupId: "",
  });

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const child = children.find((c) => c.childId === selectedId) ?? null;

  if (children.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actionHref="/parent/family/children"
        actionLabel={t("emptyCta")}
      />
    );
  }

  const reload = async () => {
    const res = await fetch("/api/parent/pickups", { credentials: "include" });
    const data = (await res.json()) as { children?: ParentPickupChild[] };
    if (res.ok && data.children) setChildren(data.children);
  };

  const addAuthorized = async () => {
    if (!child) return;
    setPending(true);
    try {
      const res = await fetch("/api/parent/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ childId: child.childId, ...form }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("personAdded"));
      setAddOpen(false);
      setForm({ name: "", relation: "", phone: "" });
      await reload();
    } catch {
      toast.error(t("errors.saveFailed"));
    } finally {
      setPending(false);
    }
  };

  const removeAuthorized = async () => {
    if (!removeId) return;
    setPending(true);
    try {
      const res = await fetch(`/api/parent/pickups/authorized/${removeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error(t("errors.deleteFailed"));
        return;
      }
      toast.success(t("personRemoved"));
      setRemoveId(null);
      await reload();
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setPending(false);
    }
  };

  const setOverride = async () => {
    if (!child || !overrideForm.personName.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/parent/pickups/overrides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childId: child.childId,
          personName: overrideForm.personName,
          note: overrideForm.note || null,
          untilTime: overrideForm.untilTime || null,
          timezone,
          authorizedPickupId: overrideForm.authorizedPickupId || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.overrideFailed"));
        return;
      }
      toast.success(t("overrideSet"));
      await reload();
    } catch {
      toast.error(t("errors.overrideFailed"));
    } finally {
      setPending(false);
    }
  };

  const clearOverride = async () => {
    if (!child) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/parent/pickups/overrides?childId=${child.childId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error(t("errors.overrideFailed"));
        return;
      }
      toast.success(t("overrideCleared"));
      await reload();
    } catch {
      toast.error(t("errors.overrideFailed"));
    } finally {
      setPending(false);
    }
  };

  const pickFromAuthorized = (pickup: AuthorizedPickup) => {
    setOverrideForm((f) => ({
      ...f,
      personName: pickup.name,
      authorizedPickupId: pickup.id,
    }));
  };

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t("intro")}
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {children.map((c) => (
          <button
            key={c.childId}
            type="button"
            onClick={() => setSelectedId(c.childId)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
              selectedId === c.childId
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {c.firstName} {c.lastName}
          </button>
        ))}
      </div>

      {child ? (
        <>
          {child.todayOverride ? (
            <BezelCard className="space-y-3 border-amber-500/40 bg-amber-500/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                    {t("todayOverride")}
                  </p>
                  <p className="mt-1 font-display text-xl text-foreground">
                    {child.todayOverride.personName}
                  </p>
                  {child.todayOverride.note ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {child.todayOverride.note}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">
                    {t("expiresIn", {
                      countdown:
                        formatPickupCountdown(child.todayOverride.expiresAt) ??
                        t("midnight"),
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => void clearOverride()}
                >
                  {t("clearOverride")}
                </Button>
              </div>
            </BezelCard>
          ) : (
            <BezelCard className="space-y-4 p-5">
              <p className="text-sm font-medium text-foreground">
                {t("setTodayOverride")}
              </p>
              <TextField
                id="override-name"
                label={t("overrideName")}
                value={overrideForm.personName}
                onChange={(e) =>
                  setOverrideForm((f) => ({ ...f, personName: e.target.value }))
                }
              />
              <TextField
                id="override-until"
                label={t("overrideUntil")}
                type="time"
                value={overrideForm.untilTime}
                onChange={(e) =>
                  setOverrideForm((f) => ({ ...f, untilTime: e.target.value }))
                }
                hint={t("overrideUntilHint")}
              />
              <TextField
                id="override-note"
                label={t("overrideNote")}
                value={overrideForm.note}
                onChange={(e) =>
                  setOverrideForm((f) => ({ ...f, note: e.target.value }))
                }
              />
              <Button
                type="button"
                disabled={pending || !overrideForm.personName.trim()}
                onClick={() => void setOverride()}
              >
                {t("saveOverride")}
              </Button>
            </BezelCard>
          )}

          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-foreground">
              {t("authorizedTitle")}
            </h2>
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t("addPerson")}
            </Button>
          </div>

          {child.authorized.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAuthorized")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {child.authorized.map((person) => (
                <li key={person.id}>
                  <BezelCard className="flex gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                      {person.photoSignedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.photoSignedUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.relation}
                      </p>
                      <a
                        href={`tel:${person.phone.replace(/\s/g, "")}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {person.phone}
                      </a>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!child.todayOverride ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => pickFromAuthorized(person)}
                        >
                          {t("useToday")}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive"
                        onClick={() => setRemoveId(person.id)}
                        aria-label={t("removePerson")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </BezelCard>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addPersonTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TextField
              id="pickup-name"
              label={t("name")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <TextField
              id="pickup-relation"
              label={t("relation")}
              value={form.relation}
              onChange={(e) =>
                setForm((f) => ({ ...f, relation: e.target.value }))
              }
              required
            />
            <TextField
              id="pickup-phone"
              label={t("phone")}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void addAuthorized()}
            >
              {t("savePerson")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title={t("removeTitle")}
        description={t("removeBody")}
        confirmLabel={t("removeConfirm")}
        cancelLabel={t("cancel")}
        variant="destructive"
        loading={pending}
        onConfirm={removeAuthorized}
      />
    </div>
  );
}
