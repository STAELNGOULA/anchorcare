/** Shared width + padding for header, sections, and footer alignment */
export const marketingContainer =
  "mx-auto w-full max-w-6xl px-4 md:px-6";

/** Uniform vertical rhythm for every marketing section */
export const marketingSection =
  "scroll-mt-28 py-24 md:py-32";

/** Hero blocks — matches section bottom rhythm */
export const marketingHero =
  "scroll-mt-28 pt-28 pb-24 md:pt-32 md:pb-28";

export const marketingMain = "flex flex-col";

/** Consistent intro block inside sections */
export const marketingSectionHeader = "max-w-2xl space-y-4";

/** Space between section intro and content grid */
export const marketingSectionBody = "mt-12 md:mt-14";

export const marketingGridGap = "gap-5 md:gap-6";

export const marketingSectionTone = {
  default: "",
  muted: "bg-secondary/40 border-y border-border/45",
  soft: "bg-muted/25 border-y border-border/35",
} as const;

export type MarketingSectionTone = keyof typeof marketingSectionTone;
