import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const messageMap = { en, fr } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

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
