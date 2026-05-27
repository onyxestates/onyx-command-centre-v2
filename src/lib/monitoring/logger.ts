import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serialiseValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[max-depth]";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => serialiseValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, serialiseValue(nested, depth + 1)])
    );
  }
  return value;
}

function buildPayload(level: LogLevel, message: string, context?: LogContext) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...(context ? { context: serialiseValue(context) } : {}),
  };
}

function writeConsole(level: LogLevel, payload: ReturnType<typeof buildPayload>) {
  const line = JSON.stringify(payload);
  if (level === "info") console.info(line);
  if (level === "warn") console.warn(line);
  if (level === "error") console.error(line);
}

export function logInfo(message: string, context?: LogContext) {
  const payload = buildPayload("info", message, context);
  writeConsole("info", payload);
  Sentry.addBreadcrumb({ category: "app", level: "info", message, data: payload.context as LogContext | undefined });
}

export function logWarn(message: string, context?: LogContext) {
  const payload = buildPayload("warn", message, context);
  writeConsole("warn", payload);
  Sentry.captureMessage(message, { level: "warning", extra: payload.context as LogContext | undefined });
}

export function logError(message: string, error?: unknown, context?: LogContext) {
  const payload = buildPayload("error", message, error ? { ...context, error } : context);
  writeConsole("error", payload);

  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: {
        message,
        ...(payload.context as LogContext | undefined),
      },
    });
    return;
  }

  Sentry.captureMessage(message, {
    level: "error",
    extra: payload.context as LogContext | undefined,
  });
}
