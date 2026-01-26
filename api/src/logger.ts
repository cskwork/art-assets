export type LogTag =
  | 'INIT'
  | 'GEN'
  | 'REVIEW'
  | 'FIX'
  | 'API'
  | 'ISSUE'
  | 'SAVE'
  | 'WRITE'
  | 'DONE'
  | 'ERROR'
  | 'SIZE';

export interface Logger {
  log: (tag: LogTag, message: string) => void;
  logSize: (label: string, text: string) => void;
  logProgress: (tag: LogTag, elapsed: number, chars: number) => void;
}

function formatTimestamp() {
  return new Date().toISOString().slice(11, 19);
}

function estimateTokens(chars: number) {
  return Math.ceil(chars / 4);
}

function createConsoleLogger(): Logger {
  return {
    log(tag, message) {
      console.log(`[${formatTimestamp()}] [${tag}] ${message}`);
    },
    logSize(label, text) {
      const chars = text.length;
      const tokens = estimateTokens(chars);
      console.log(
        `[${formatTimestamp()}] [SIZE] ${label}: ${chars.toLocaleString()}자 (~${tokens.toLocaleString()} 토큰)`
      );
    },
    logProgress(tag, elapsed, chars) {
      process.stdout.write(
        `\r[${tag}] ${elapsed.toFixed(0)}초 경과, ${chars.toLocaleString()}자 수신...`
      );
    }
  };
}

function createNoopLogger(): Logger {
  return {
    log() {},
    logSize() {},
    logProgress() {}
  };
}

let currentLogger: Logger = createNoopLogger();

export function enableLogging(enabled = true) {
  currentLogger = enabled ? createConsoleLogger() : createNoopLogger();
}

export function getLogger(): Logger {
  return currentLogger;
}

export function log(tag: LogTag, message: string) {
  currentLogger.log(tag, message);
}

export function logSize(label: string, text: string) {
  currentLogger.logSize(label, text);
}

export function logProgress(tag: LogTag, elapsed: number, chars: number) {
  currentLogger.logProgress(tag, elapsed, chars);
}
