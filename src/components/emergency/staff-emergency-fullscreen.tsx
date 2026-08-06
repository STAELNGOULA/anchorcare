"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Phone, X } from "lucide-react";
import { AllergySeverityStrip } from "@/components/roster/allergy-severity-strip";
import { Button } from "@/components/ui/button";
import type { StaffEmergencyCard, StaffEmergencyNavItem } from "@/lib/emergency/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type StaffEmergencyFullscreenProps = {
  open: boolean;
  onClose: () => void;
  registrationId: string | null;
  rosterNav?: StaffEmergencyNavItem[];
};

export function StaffEmergencyFullscreen({
  open,
  onClose,
  registrationId,
  rosterNav = [],
}: StaffEmergencyFullscreenProps) {
  const t = useTranslations("emergency.staff");
  const reduceMotion = useReducedMotion();
  const [card, setCard] = useState<StaffEmergencyCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(registrationId);
  const touchStartX = useRef<number | null>(null);

  const navIndex = rosterNav.findIndex((n) => n.registrationId === activeId);
  const hasNav = rosterNav.length > 1;

  const fetchCard = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster/${id}/emergency`, {
        credentials: "include",
      });
      if (!res.ok) {
        setCard(null);
        return;
      }
      const data = (await res.json()) as StaffEmergencyCard;
      setCard(data);
    } catch {
      setCard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveId(registrationId);
  }, [open, registrationId]);

  useEffect(() => {
    if (!open || !activeId) return;
    void fetchCard(activeId);
  }, [open, activeId, fetchCard]);

  useEffect(() => {
    if (!open || !activeId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`emergency-card-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_program_consents",
          filter: `registration_id=eq.${activeId}`,
        },
        () => {
          void fetchCard(activeId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, activeId, fetchCard]);

  const goPrev = useCallback(() => {
    if (!hasNav || navIndex <= 0) return;
    setActiveId(rosterNav[navIndex - 1]!.registrationId);
  }, [hasNav, navIndex, rosterNav]);

  const goNext = useCallback(() => {
    if (!hasNav || navIndex < 0 || navIndex >= rosterNav.length - 1) return;
    setActiveId(rosterNav[navIndex + 1]!.registrationId);
  }, [hasNav, navIndex, rosterNav]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNav) goNext();
      if (e.key === "ArrowLeft" && hasNav) goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, hasNav, goNext, goPrev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !hasNav) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (diff > 56) goNext();
    if (diff < -56) goPrev();
    touchStartX.current = null;
  };

  if (!open || !activeId) return null;

  const meds = card?.medications ?? [];
  const contacts = card?.emergencyContacts ?? [];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col",
        "bg-white text-black [color-scheme:light]",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-emergency-title"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-black px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-black/70">
              {t("label")}
            </p>
            <h2
              id="staff-emergency-title"
              className="truncate text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {card
                ? `${card.firstName} ${card.lastName}`
                : t("loading")}
            </h2>
            {card ? (
              <p className="truncate text-lg text-black/80">{card.programName}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full text-black hover:bg-black/10"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="h-6 w-6" />
          </Button>
        </header>

        {hasNav ? (
          <div className="flex items-center justify-between border-b border-black/20 px-2 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-black"
              onClick={goPrev}
              disabled={navIndex <= 0}
              aria-label={t("prevChild")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <p className="text-sm font-medium text-black/80">
              {t("childOf", {
                current: navIndex + 1,
                total: rosterNav.length,
              })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-black"
              onClick={goNext}
              disabled={navIndex < 0 || navIndex >= rosterNav.length - 1}
              aria-label={t("nextChild")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-4 py-6 text-lg sm:px-6">
          {loading && !card ? (
            <p className="text-lg text-black/70">{t("loading")}</p>
          ) : null}

          {card ? (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {t("allergies")}
                </h3>
                {card.withheld.allergies ? (
                  <p className="rounded-lg border-2 border-dashed border-black/30 px-4 py-3 text-base text-black/70">
                    {t("notShared")}
                  </p>
                ) : (
                  <div className="[&_*]:!text-black">
                    <AllergySeverityStrip
                      items={card.allergyItems}
                      allergiesText={card.allergies}
                    />
                  </div>
                )}
              </section>

              {card.medicalConditions?.trim() && !card.withheld.allergies ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("conditions")}
                  </h3>
                  <p className="text-lg leading-relaxed">{card.medicalConditions}</p>
                </section>
              ) : null}

              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {t("medications")}
                </h3>
                {card.withheld.meds ? (
                  <p className="rounded-lg border-2 border-dashed border-black/30 px-4 py-3 text-base text-black/70">
                    {t("notShared")}
                  </p>
                ) : meds.length > 0 ? (
                  <ul className="space-y-3">
                    {meds.map((med) => (
                      <li
                        key={`${med.name}-${med.schedule}`}
                        className="rounded-lg border-2 border-black px-4 py-4"
                      >
                        <p className="text-lg font-semibold">{med.name}</p>
                        <p className="text-base text-black/80">
                          {[med.dose, med.schedule].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-black/70">{t("noneListed")}</p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {t("contacts")}
                </h3>
                {card.withheld.contacts ? (
                  <p className="rounded-lg border-2 border-dashed border-black/30 px-4 py-3 text-base text-black/70">
                    {t("notShared")}
                  </p>
                ) : contacts.length > 0 ? (
                  <ul className="space-y-3">
                    {contacts.map((contact) => (
                      <li key={contact.phone}>
                        <a
                          href={`tel:${contact.phone.replace(/\s/g, "")}`}
                          className={cn(
                            "flex min-h-[3.5rem] items-center justify-between gap-3",
                            "rounded-lg border-2 border-black px-4 py-4",
                            "transition-transform active:scale-[0.99]",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-lg font-semibold">{contact.name}</p>
                            <p className="text-base text-black/80">
                              {contact.relation}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-2 text-lg font-bold">
                            <Phone className="h-5 w-5" aria-hidden />
                            {contact.phone}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-black/70">{t("noneListed")}</p>
                )}
              </section>

              {(card.physicianName || card.physicianPhone) &&
              !card.withheld.contacts ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {t("physician")}
                  </h3>
                  {card.physicianName ? (
                    <p className="text-lg">{card.physicianName}</p>
                  ) : null}
                  {card.physicianPhone ? (
                    <a
                      href={`tel:${card.physicianPhone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 text-lg font-bold underline"
                    >
                      <Phone className="h-5 w-5" aria-hidden />
                      {card.physicianPhone}
                    </a>
                  ) : null}
                </section>
              ) : null}

              <p className="text-xs text-black/50">
                {t("updated", {
                  time: new Date(card.updatedAt).toLocaleString(),
                })}
              </p>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
