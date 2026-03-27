// src/lib/logger.ts
// 구조화 로거 모듈
// debug 레벨은 NODE_ENV=production 에서 무시된다.
// 상세 규칙: PROJECT_RULES.md > 7. 로깅 / 모니터링 규칙

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: unknown;
  duration?: number;
}

interface LogOptions {
  context?: string;
  data?: unknown;
  duration?: number;
}

function log(level: LogLevel, message: string, options?: LogOptions): void {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(options?.context && { context: options.context }),
    ...(options?.data !== undefined && { data: options.data }),
    ...(options?.duration !== undefined && { duration: options.duration }),
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  error: (message: string, options?: LogOptions) =>
    log("error", message, options),
  warn: (message: string, options?: LogOptions) =>
    log("warn", message, options),
  info: (message: string, options?: LogOptions) =>
    log("info", message, options),
  debug: (message: string, options?: LogOptions) =>
    log("debug", message, options),
};
