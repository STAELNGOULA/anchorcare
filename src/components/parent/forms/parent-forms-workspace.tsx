"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { FileUpload } from "@/components/forms/file-upload";
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
import type { ParentFormRecord, ParentFormType } from "@/lib/forms/form-types";
import { cn } from "@/lib/utils";

type ParentFormsWorkspaceProps = {
  initialForms: ParentFormRecord[];
  children: { id: string; name: string }[];
};

const FORM_TYPES: ParentFormType[] = [
  "immunization",
  "physical",
  "permission",
  "custom",
];

export function ParentFormsWorkspace({
  initialForms,
  children,
}: ParentFormsWorkspaceProps) {
  const t = useTranslations("parent.you.forms");
  const [forms, setForms] = useState(initialForms);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [formType, setFormType] = useState<ParentFormType>("immunization");
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState("");

  const expiringSoon = useMemo(
    () =>
      forms.filter(
        (f) =>
          f.daysUntilExpiry != null &&
          f.daysUntilExpiry >= 0 &&
          f.daysUntilExpiry <= 30,
      ),
    [forms],
  );

  const reload = async () => {
    const res = await fetch("/api/parent/forms", { credentials: "include" });
    const data = (await res.json()) as { forms?: ParentFormRecord[] };
    if (res.ok && data.forms) setForms(data.forms);
  };

  const upload = async () => {
    if (!file || !title.trim()) return;
    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("title", title.trim());
      body.set("formType", formType);
      if (childId) body.set("childId", childId);
      if (expiresAt) body.set("expiresAt", expiresAt);

      const res = await fetch("/api/parent/forms", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.uploadFailed"));
        return;
      }
      toast.success(t("uploadSuccess"));
      setUploadOpen(false);
      setFile(null);
      setTitle("");
      setExpiresAt("");
      await reload();
    } catch {
      toast.error(t("errors.uploadFailed"));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!deleteId) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/parent/forms?id=${encodeURIComponent(deleteId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        toast.error(t("errors.deleteFailed"));
        return;
      }
      toast.success(t("deleteSuccess"));
      setDeleteId(null);
      await reload();
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button type="button" onClick={() => setUploadOpen(true)} className="min-h-11">
          <Plus className="mr-2 size-4" aria-hidden />
          {t("uploadCta")}
        </Button>
      </div>

      {expiringSoon.length > 0 ? (
        <BezelCard className="border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-foreground">{t("expiringTitle")}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {expiringSoon.slice(0, 3).map((f) => (
              <li key={f.id}>
                {t("expiringItem", {
                  title: f.title,
                  days: f.daysUntilExpiry ?? 0,
                })}
              </li>
            ))}
          </ul>
        </BezelCard>
      ) : null}

      {forms.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          actionLabel={t("uploadCta")}
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <ul className="space-y-3">
          {forms.map((form) => (
            <li key={form.id}>
              <BezelCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileText className="size-5 text-muted-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{form.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`types.${form.formType}`)}
                      {form.childName ? ` · ${form.childName}` : ""}
                      {form.expiresAt
                        ? ` · ${t("expires", { date: form.expiresAt })}`
                        : ""}
                    </p>
                    {form.daysUntilExpiry != null && form.daysUntilExpiry <= 30 ? (
                      <p
                        className={cn(
                          "mt-1 text-xs font-medium",
                          form.daysUntilExpiry <= 7
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-muted-foreground",
                        )}
                      >
                        {t("expiresIn", { days: form.daysUntilExpiry })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {form.signedUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={form.signedUrl} target="_blank" rel="noopener noreferrer">
                        {t("view")}
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(form.id)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </BezelCard>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md rounded-[1.25rem]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("uploadTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TextField
              id="form-title"
              label={t("fields.title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("fields.type")}
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as ParentFormType)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {FORM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            {children.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("fields.child")}
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">{t("fields.childOptional")}</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <TextField
              id="form-expires-at"
              label={t("fields.expiresAt")}
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <FileUpload
              id="parent-form-file"
              label={t("fields.file")}
              accept=".pdf,image/jpeg,image/png,image/webp"
              value={file}
              onChange={setFile}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button onClick={() => void upload()} disabled={pending || !file || !title.trim()}>
              {t("uploadCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        onConfirm={() => void remove()}
        loading={pending}
        variant="destructive"
      />
    </div>
  );
}
