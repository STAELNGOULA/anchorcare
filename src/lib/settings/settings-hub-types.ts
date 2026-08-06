export type SettingsHubBadge = "p15" | "p2";

export type SettingsHubSection = {
  key: string;
  href?: string;
  badge?: SettingsHubBadge;
  /** Muted card with phase badge — still navigable when href is set */
  locked?: boolean;
  planBadge?: "free" | "family";
  hintKey?: string;
};

export type SettingsHubGroup = {
  key: string;
  sections: readonly SettingsHubSection[];
};

export type SettingsHubHints = Partial<Record<string, string>>;
