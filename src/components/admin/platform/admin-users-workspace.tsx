"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { AdminUserListItem } from "@/lib/admin/platform-types";
import { cn } from "@/lib/utils";

export function AdminUsersWorkspace() {
  const t = useTranslations("admin.users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q.trim())}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(search), 280);
    return () => clearTimeout(timer);
  }, [search, load]);

  const runAction = async (userId: string, action: string, reason?: string) => {
    setActionPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t(`errors.${data.error as string}`) || t("errors.failed"));
        return;
      }
      toast.success(t(`toast.${action}`));
      setSelected(data.user);
      void load(search);
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-full border border-input bg-background py-2 pl-11 pr-4 text-sm"
        />
      </div>

      {error ? <ErrorState title={t("errorTitle")} onRetry={() => void load(search)} /> : null}

      {loading ? <SkeletonList count={4} /> : null}

      {!loading && search.trim().length >= 2 && users.length === 0 && !error ? (
        <EmptyState title={t("noResults")} description={t("noResultsBody")} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelected(user)}
              className={cn(
                "w-full rounded-[1.25rem] bg-card p-4 text-left ring-1 ring-border/50",
                "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5 active:scale-[0.99]",
                selected?.id === user.id && "ring-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    {user.fullName ?? user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    user.accountStatus === "suspended"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {user.accountStatus}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("meta", {
                  role: user.role,
                  children: user.childCount,
                })}
              </p>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
            <h2 className="font-display text-xl text-foreground">{t("detailTitle")}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("fields.email")}</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("fields.role")}</dt>
                <dd className="capitalize">{selected.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("fields.status")}</dt>
                <dd className="capitalize">{selected.accountStatus}</dd>
              </div>
            </dl>

            {selected.accountStatus === "active" ? (
              <div className="space-y-2">
                <label htmlFor="suspend-reason" className="text-sm font-medium">
                  {t("suspendReason")}
                </label>
                <textarea
                  id="suspend-reason"
                  rows={2}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() =>
                    void runAction(selected.id, "suspend", suspendReason)
                  }
                  className="inline-flex min-h-11 items-center rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground disabled:opacity-60"
                >
                  {t("suspendCta")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={actionPending}
                onClick={() => void runAction(selected.id, "unsuspend")}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {t("unsuspendCta")}
              </button>
            )}

            <button
              type="button"
              disabled={actionPending}
              onClick={() => void runAction(selected.id, "impersonate_view")}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("impersonateCta")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
