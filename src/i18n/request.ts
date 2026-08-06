import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const messageMap = { en, fr } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = cookieLocale ?? (await requestLocale);

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messageMap[locale as keyof typeof messageMap] ?? en,
  };
});
