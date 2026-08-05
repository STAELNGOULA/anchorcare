/** Director app shell layout tokens */
export const directorRailWidth = "w-52";

/** 13rem — matches sidebar rail */
export const directorRailCol = "13rem";

export const directorContainer = "mx-auto w-full max-w-6xl px-4 md:px-6";

export const directorMain = "flex min-h-[100dvh] flex-col bg-background";

/** Centered shell: 6xl content + rail + gap + symmetric px-6 */
export const directorShellMaxWidth =
  "max-w-[calc(72rem+13rem+2rem+3rem)]";

export const directorShellOuter = `relative z-10 mx-auto w-full flex-1 px-4 md:px-6 ${directorShellMaxWidth}`;

/**
 * Grid: header spans both columns; sidebar + content share row two.
 * gap-x / gap-y keep breathing room between header, rail, and main.
 */
export const directorShellGrid =
  "grid w-full flex-1 content-start grid-cols-1 gap-y-6 lg:grid-cols-[13rem_minmax(0,72rem)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6";

/** Matches org bar height (pt-5 + pill) — keeps sticky nav flush with content on load */
export const shellNavStickyTop = "lg:sticky lg:top-[4.75rem]";

export const shellNavHeight =
  "lg:h-[calc(100dvh-4.75rem-1.5rem)]";

/** Clears mobile bottom island; no top padding on lg so title aligns with sidebar */
export const directorContent = "min-w-0 flex-1 pb-24 pt-4 md:pb-8 lg:pb-10 lg:pt-0";
