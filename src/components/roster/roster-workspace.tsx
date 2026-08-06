"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { AllergySeverityStrip } from "@/components/roster/allergy-severity-strip";
import { ClearanceBadge } from "@/components/roster/clearance-badge";
import { StaffEmergencyFullscreen } from "@/components/emergency/staff-emergency-fullscreen";
import { toNavItems } from "@/lib/emergency/nav-utils";
import { MorningHealthIndicator } from "@/components/roster/morning-health-indicator";
import { PickupOverrideIndicator } from "@/components/roster/pickup-override-indicator";
import { PickupEtaIndicator } from "@/components/roster/pickup-eta-indicator";
import { RosterFilterSheet } from "@/components/roster/roster-filter-sheet";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClearanceStatus, RosterListItem } from "@/lib/roster/types";
import { ROSTER_PAGE_SIZE } from "@/lib/roster/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "cards";

type RosterWorkspaceProps = {
  mode: "business" | "coach";
  initialItems: RosterListItem[];
  initialTotal: number;
  programs: { id: string; name: string }[];
  detailBasePath: string;
  emptyCtaHref?: string;
  fieldModeHref?: string;
  handoffHref?: string;
};

function childAge(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return String(age);
}

export function RosterWorkspace({
  mode,
  initialItems,
  initialTotal,
  programs,
  detailBasePath,
  emptyCtaHref,
  fieldModeHref,
  handoffHref,
}: RosterWorkspaceProps) {
  const t = useTranslations("roster");
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [programId, setProgramId] = useState("");
  const [clearance, setClearance] = useState<ClearanceStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emergencyRegistrationId, setEmergencyRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const apiPath = mode === "business" ? "/api/business/roster" : "/api/coach/roster";

  const fetchRoster = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (programId) params.set("programId", programId);
      if (clearance !== "all") params.set("clearance", clearance);
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
  }, [apiPath, clearance, debouncedQ, page, programId]);

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
      .channel("roster-pickup-overrides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_overrides" },
        () => {
          void fetchRoster();
        },
      )
      .subscribe();
    const etaChannel = supabase
      .channel("roster-pickup-eta")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_eta_events" },
        () => {
          void fetchRoster();
        },
      )
      .subscribe();
    const healthChannel = supabase
      .channel("roster-morning-health")
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

  const openEmergency = (registrationId: string) => {
    setEmergencyRegistrationId(registrationId);
  };
  const totalPages = Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE));
  const activeFilters = useMemo(
    () => [programId, clearance !== "all" ? clearance : ""].filter(Boolean).length,
    [clearance, programId],
  );

  if (total === 0 && !debouncedQ && !programId && clearance === "all" && !loading) {
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Label htmlFor="roster-search" className="sr-only">
              {t("searchLabel")}
            </Label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="roster-search"
              placeholder={t("searchPlaceholder")}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-11 pl-9"
            />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              aria-label={t("filterProgram")}
            >
              <option value="">{t("allPrograms")}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={clearance}
              onChange={(e) => {
                setClearance(e.target.value as ClearanceStatus | "all");
                setPage(1);
              }}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              aria-label={t("filterClearance")}
            >
              <option value="all">{t("allClearance")}</option>
              <option value="cleared">{t("clearance.cleared")}</option>
              <option value="pending">{t("clearance.pending")}</option>
              <option value="hold">{t("clearance.hold")}</option>
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("filters")}
            {activeFilters > 0 ? (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {activeFilters}
              </span>
            ) : null}
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border p-1">
          {handoffHref ? (
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link href={handoffHref}>{t("handoff")}</Link>
            </Button>
          ) : null}
          {fieldModeHref ? (
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link href={fieldModeHref}>{t("fieldMode")}</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-label={t("viewTable")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            onClick={() => setViewMode("cards")}
            aria-pressed={viewMode === "cards"}
            aria-label={t("viewCards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((child) => (
            <RosterCard
              key={child.registrationId}
              child={child}
              detailHref={`${detailBasePath}/${child.registrationId}`}
              onEmergency={() => openEmergency(child.registrationId)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((child) => {
            const expanded = expandedId === child.registrationId;
            const age = childAge(child.dateOfBirth);
            return (
              <BezelCard
                key={child.registrationId}
                className={cn(
                  "overflow-hidden p-0",
                  child.pickupOverrideToday &&
                    "ring-2 ring-amber-500/45 ring-offset-1 ring-offset-background",
                )}
              >
                <div className="flex flex-col">
                  <div className="flex items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
                    <Link
                      href={`${detailBasePath}/${child.registrationId}`}
                      className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
                    >
                      <ChildAvatar child={child} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-foreground">
                            {child.firstName} {child.lastName}
                            {age ? (
                              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                                · {t("age", { age })}
                              </span>
                            ) : null}
                          </p>
                          <ClearanceBadge status={child.clearanceStatus} />
                          <PickupOverrideIndicator
                            override={child.pickupOverride}
                            showCountdown
                          />
                          <PickupEtaIndicator eta={child.pickupEta} showCountdown />
                          <MorningHealthIndicator health={child.morningHealth} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {child.programName}
                          {child.groupName ? ` · ${child.groupName}` : ""}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 rounded-full border-red-600/30 text-red-700 hover:bg-red-600/10 dark:text-red-300"
                        onClick={() => openEmergency(child.registrationId)}
                        aria-label={t("emergency.open", {
                          name: `${child.firstName} ${child.lastName}`,
                        })}
                      >
                        <ShieldAlert className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11"
                        onClick={() =>
                          setExpandedId(expanded ? null : child.registrationId)
                        }
                        aria-expanded={expanded}
                        aria-label={t(expanded ? "collapse" : "expand")}
                      >
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 transition-transform duration-200 ease-out",
                            expanded && "rotate-180",
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-border/50 bg-muted/20 px-3 py-2 sm:px-4">
                    <AllergySeverityStrip
                      items={child.allergyItems}
                      allergiesText={child.allergies}
                      compact={!expanded}
                    />
                  </div>
                  {expanded ? (
                    <div className="flex flex-wrap gap-2 border-t border-border/50 px-3 py-3 sm:px-4">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`${detailBasePath}/${child.registrationId}`}>
                          {t("viewProfile")}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEmergency(child.registrationId)}
                      >
                        {t("emergency.label")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </BezelCard>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {t("pagination", {
              from: (page - 1) * ROSTER_PAGE_SIZE + 1,
              to: Math.min(page * ROSTER_PAGE_SIZE, total),
              total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("prev")}
            </Button>
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
        </div>
      ) : null}

      <RosterFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        programs={programs}
        programId={programId}
        clearance={clearance}
        onApply={(next) => {
          setProgramId(next.programId);
          setClearance(next.clearance);
          setPage(1);
        }}
      />

      <StaffEmergencyFullscreen
        open={Boolean(emergencyRegistrationId)}
        registrationId={emergencyRegistrationId}
        rosterNav={rosterNav}
        onClose={() => setEmergencyRegistrationId(null)}
      />
    </div>
  );
}

function ChildAvatar({ child }: { child: RosterListItem }) {
  const initials = `${child.firstName.charAt(0)}${child.lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
      {child.photoSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={child.photoSignedUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

function RosterCard({
  child,
  detailHref,
  onEmergency,
  t,
}: {
  child: RosterListItem;
  detailHref: string;
  onEmergency: () => void;
  t: ReturnType<typeof useTranslations<"roster">>;
}) {
  const age = childAge(child.dateOfBirth);
  return (
    <BezelCard
      className={cn(
        "flex flex-col overflow-hidden p-0",
        child.pickupOverrideToday &&
          "ring-2 ring-amber-500/45 ring-offset-1 ring-offset-background",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <ChildAvatar child={child} />
        <div className="min-w-0 flex-1">
          <Link href={detailHref} className="block">
            <p className="font-medium text-foreground">
              {child.firstName} {child.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {child.programName}
              {age ? ` · ${t("age", { age })}` : ""}
            </p>
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ClearanceBadge status={child.clearanceStatus} />
            <PickupOverrideIndicator override={child.pickupOverride} showCountdown />
            <PickupEtaIndicator eta={child.pickupEta} showCountdown />
            <MorningHealthIndicator health={child.morningHealth} />
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-11 w-11 shrink-0 rounded-full border-red-600/30 text-red-700 dark:text-red-300"
          onClick={onEmergency}
          aria-label={t("emergency.open", {
            name: `${child.firstName} ${child.lastName}`,
          })}
        >
          <ShieldAlert className="h-5 w-5" />
        </Button>
      </div>
      <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
        <AllergySeverityStrip
          items={child.allergyItems}
          allergiesText={child.allergies}
        />
      </div>
      <div className="border-t border-border/50 p-3">
        <Button asChild variant="secondary" size="sm" className="w-full">
          <Link href={detailHref}>{t("viewProfile")}</Link>
        </Button>
      </div>
    </BezelCard>
  );
}
