"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, Sun } from "lucide-react";
import { toast } from "sonner";
import { AllergySeverityStrip } from "@/components/roster/allergy-severity-strip";
import { ClearanceBadge } from "@/components/roster/clearance-badge";
import { StaffEmergencyFullscreen } from "@/components/emergency/staff-emergency-fullscreen";
import { toNavItems } from "@/lib/emergency/nav-utils";
import { PickupOverrideIndicator } from "@/components/roster/pickup-override-indicator";
import { MorningHealthIndicator } from "@/components/roster/morning-health-indicator";
import { PickupEtaIndicator } from "@/components/roster/pickup-eta-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { RosterListItem } from "@/lib/roster/types";
import { ROSTER_PAGE_SIZE } from "@/lib/roster/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const FIELD_TIP_KEY = "anchor_field_mode_tip_seen";

type FieldRosterWorkspaceProps = {
  mode: "business" | "coach";
  initialItems: RosterListItem[];
  initialTotal: number;
  programs: { id: string; name: string }[];
  emptyCtaHref?: string;
};

export function FieldRosterWorkspace({
  mode,
  initialItems,
  initialTotal,
  programs,
  emptyCtaHref,
}: FieldRosterWorkspaceProps) {
  const t = useTranslations("roster.field");
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [programId, setProgramId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emergencyRegistrationId, setEmergencyRegistrationId] = useState<string | null>(null);

  const apiPath = mode === "business" ? "/api/business/roster" : "/api/coach/roster";

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (programId) params.set("programId", programId);
      params.set("page", String(page));

      const res = await fetch(`${apiPath}?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        items?: RosterListItem[];
        total?: number;
      };
      if (res.ok) {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [apiPath, page, programId]);

  const skipInitialFetch = useRef(true);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("field-roster-pickup-overrides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_overrides" },
        () => {
          void fetchRoster();
        },
      )
      .subscribe();
    const etaChannel = supabase
      .channel("field-roster-pickup-eta")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_eta_events" },
        () => {
          void fetchRoster();
        },
      )
      .subscribe();
    const healthChannel = supabase
      .channel("field-roster-morning-health")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "morning_health_checks" },
        () => {
          void fetchRoster();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(etaChannel);
      void supabase.removeChannel(healthChannel);
    };
  }, [fetchRoster]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(FIELD_TIP_KEY)) {
        toast.message(t("tipTitle"), { description: t("tipBody"), duration: 10000 });
        localStorage.setItem(FIELD_TIP_KEY, "1");
      }
    } catch {
      // ignore storage errors
    }
  }, [t]);

  const rosterNav = useMemo(
    () =>
      toNavItems(
        items.map((item) => ({
          registrationId: item.registrationId,
          firstName: item.firstName,
          lastName: item.lastName,
        })),
      ),
    [items],
  );

  const totalPages = Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE));

  if (total === 0 && !programId && !loading) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyBody")}
        actionHref={emptyCtaHref}
        actionLabel={emptyCtaHref ? t("emptyCta") : undefined}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-[#1B2B4B] px-4 py-3 text-anchor-sand shadow-sm"
        role="status"
      >
        <Sun className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <div>
          <p className="text-sm font-medium text-anchor-sand">{t("bannerTitle")}</p>
          <p className="mt-0.5 text-sm text-anchor-sand/80">{t("bannerBody")}</p>
        </div>
      </div>

      {programs.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="field-program" className="text-sm text-muted-foreground">
            {t("programFilter")}
          </label>
          <select
            id="field-program"
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setPage(1);
            }}
            className="h-11 min-w-[12rem] rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">{t("allPrograms")}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((child) => (
            <li key={child.registrationId}>
              <FieldChildCard
                child={child}
                onEmergency={() => setEmergencyRegistrationId(child.registrationId)}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pagination", {
              from: (page - 1) * ROSTER_PAGE_SIZE + 1,
              to: Math.min(page * ROSTER_PAGE_SIZE, total),
              total,
            })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      ) : null}

      <StaffEmergencyFullscreen
        open={emergencyRegistrationId !== null}
        onClose={() => setEmergencyRegistrationId(null)}
        registrationId={emergencyRegistrationId}
        rosterNav={rosterNav}
      />
    </div>
  );
}

function FieldChildCard({
  child,
  onEmergency,
}: {
  child: RosterListItem;
  onEmergency: () => void;
}) {
  const t = useTranslations("roster.field");

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border-2 border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow] duration-200",
        "hover:border-accent/40 hover:shadow-md",
        child.pickupOverrideToday && "border-amber-500/50 ring-1 ring-amber-500/20",
      )}
    >
      <div className="flex items-start gap-4">
        <FieldAvatar child={child} />
        <div className="min-w-0 flex-1">
          <p className="text-[1.375rem] font-semibold leading-tight tracking-tight text-foreground">
            {child.firstName} {child.lastName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{child.programName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ClearanceBadge status={child.clearanceStatus} />
            <PickupOverrideIndicator override={child.pickupOverride} showCountdown />
            <PickupEtaIndicator eta={child.pickupEta} showCountdown />
            <MorningHealthIndicator health={child.morningHealth} />
          </div>
        </div>
      </div>

      <AllergySeverityStrip items={child.allergyItems} allergiesText={child.allergies} />

      <Button
        type="button"
        className="h-12 w-full text-base"
        onClick={onEmergency}
      >
        <ShieldAlert className="mr-2 size-5" aria-hidden />
        {t("emergencyCta")}
      </Button>
    </article>
  );
}

function FieldAvatar({ child }: { child: RosterListItem }) {
  const initials = `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`.toUpperCase();

  if (child.photoSignedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={child.photoSignedUrl}
        alt=""
        className="size-16 shrink-0 rounded-2xl object-cover ring-2 ring-border"
      />
    );
  }

  return (
    <div
      className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary ring-2 ring-border"
      aria-hidden
    >
      {initials}
    </div>
  );
}
