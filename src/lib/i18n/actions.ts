"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!routing.locales.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
