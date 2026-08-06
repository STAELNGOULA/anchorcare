import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: { service: "anchor-care" },
  ...(isDev
    ? {
        transport: {
          target: "pino/file",
          options: { destination: 1 },
        },
      }
    : {}),
});

export type LogContext = {
  requestId?: string;
  userId?: string;
  path?: string;
};

export function childLogger(context: LogContext) {
  return logger.child(context);
}
