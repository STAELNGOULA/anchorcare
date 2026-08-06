/** Token lifetime — 7 days per Phase 18 spec. */
export const SMS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Max views before link stops working. */
export const SMS_TOKEN_MAX_VIEWS = 50;

/** Rapid views from one IP trigger revocation (suspicious traffic). */
export const SMS_SUSPICIOUS_VIEWS_THRESHOLD = 15;

/** Minimum ms between views to count toward suspicious burst. */
export const SMS_SUSPICIOUS_BURST_MS = 60_000;
