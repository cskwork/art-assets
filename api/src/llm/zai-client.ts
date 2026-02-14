import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { TextDecoder } from 'node:util';
import { log, logSize, logProgress, LogTag } from '../logger';

export interface ZaiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZaiClientOptions {
  apiKey: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  label?: LogTag;
  onProgress?: (elapsed: number, chars: number) => void;
}

const DEFAULT_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4.7';
const DEFAULT_MAX_TOKENS = 16384;
const DEFAULT_TEMPERATURE = 1.0;
const DEFAULT_TIMEOUT_MS = 600000; // 10분
const PROGRESS_INTERVAL_MS = 5000;

/** Models that support the thinking parameter */
const THINKING_MODELS = new Set(['glm-5']);

function needsThinking(model: string) {
  return THINKING_MODELS.has(model);
}

function buildRequestBody(
  messages: ZaiChatMessage[],
  options: ZaiClientOptions,
  stream: boolean
) {
  const model = options.model ?? DEFAULT_MODEL;
  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE
  };

  if (needsThinking(model)) {
    body.thinking = { type: 'enabled' };
  }

  return body;
}

function processSseLines(lines: string[], content: string) {
  let updated = content;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) {
      continue;
    }

    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') {
      return { content: updated, done: true };
    }

    try {
      const parsed = JSON.parse(data);
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string') {
        updated += delta;
      }

      if (parsed?.choices?.[0]?.finish_reason === 'stop') {
        return { content: updated, done: true };
      }
    } catch {
      continue;
    }
  }

  return { content: updated, done: false };
}

export function collectSseContent(chunks: string[]) {
  let buffer = '';
  let content = '';

  for (const chunk of chunks) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    const result = processSseLines(lines, content);
    content = result.content;
    if (result.done) {
      break;
    }
  }

  return content;
}

async function streamWithFetch(
  messages: ZaiChatMessage[],
  options: ZaiClientOptions
) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const label = options.label ?? 'API';
  const startTime = Date.now();
  const model = options.model ?? DEFAULT_MODEL;
  const requestBody = buildRequestBody(messages, options, true);

  log(label, `API 호출 시작 (${model}, max_tokens=${requestBody.max_tokens})...`);

  try {
    const response = await fetch(options.apiUrl ?? DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        errorDetail = await response.text();
        errorDetail = errorDetail.slice(0, 300);
      } catch { /* ignore */ }
      const detail = errorDetail ? ` - ${errorDetail}` : '';
      throw new Error(`Z.ai API 오류: ${response.status} ${response.statusText}${detail}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Z.ai 응답 스트림을 읽을 수 없습니다.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let lastProgressTime = startTime;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      const result = processSseLines(lines, content);
      content = result.content;

      const now = Date.now();
      if (now - lastProgressTime > PROGRESS_INTERVAL_MS) {
        const elapsed = (now - startTime) / 1000;
        if (options.onProgress) {
          options.onProgress(elapsed, content.length);
        } else {
          logProgress(label, elapsed, content.length);
        }
        lastProgressTime = now;
      }

      if (result.done) {
        const elapsed = (Date.now() - startTime) / 1000;
        log(label, `완료 (${elapsed.toFixed(1)}초, ${content.length.toLocaleString()}자)`);
        return content;
      }
    }

    const elapsed = (Date.now() - startTime) / 1000;
    log(label, `스트림 종료 (${elapsed.toFixed(1)}초, ${content.length.toLocaleString()}자)`);
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Z.ai API 타임아웃 (${timeoutMs / 1000}초)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function streamWithHttp(
  messages: ZaiChatMessage[],
  options: ZaiClientOptions
) {
  const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
  const model = options.model ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const label = options.label ?? 'API';
  const requestBody = buildRequestBody(messages, options, true);

  const payload = JSON.stringify(requestBody);
  const url = new URL(apiUrl);
  const requestFn = url.protocol === 'https:' ? https.request : http.request;
  const startTime = Date.now();

  logSize(`${label} 요청`, payload);
  log(label, `API 호출 시작 (${model}, max_tokens=${requestBody.max_tokens})...`);

  return new Promise<string>((resolve, reject) => {
    let timedOut = false;

    const req = requestFn(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: timeoutMs
      },
      (res) => {
        const statusCode = res.statusCode ?? 0;
        const statusMessage = res.statusMessage ?? '';

        if (statusCode < 200 || statusCode >= 300) {
          let errorBody = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            errorBody += chunk;
          });
          res.on('end', () => {
            const detail = errorBody ? ` - ${errorBody.slice(0, 200)}` : '';
            reject(new Error(`Z.ai API 오류: ${statusCode} ${statusMessage}${detail}`));
          });
          return;
        }

        let resolved = false;
        let buffer = '';
        let content = '';
        let lastProgressTime = startTime;

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          const result = processSseLines(lines, content);
          content = result.content;

          const now = Date.now();
          if (now - lastProgressTime > PROGRESS_INTERVAL_MS) {
            const elapsed = (now - startTime) / 1000;
            if (options.onProgress) {
              options.onProgress(elapsed, content.length);
            } else {
              logProgress(label, elapsed, content.length);
            }
            lastProgressTime = now;
          }

          if (result.done && !resolved) {
            resolved = true;
            process.stdout.write('\n');
            const elapsed = (Date.now() - startTime) / 1000;
            log(label, `완료 (${elapsed.toFixed(1)}초, ${content.length.toLocaleString()}자)`);
            res.destroy();
            resolve(content);
          }
        });
        res.on('end', () => {
          if (!resolved) {
            process.stdout.write('\n');
            const elapsed = (Date.now() - startTime) / 1000;
            log(label, `스트림 종료 (${elapsed.toFixed(1)}초, ${content.length.toLocaleString()}자)`);
            resolve(content);
          }
        });
      }
    );

    req.on('timeout', () => {
      timedOut = true;
      req.destroy();
      reject(new Error(`Z.ai API 타임아웃 (${timeoutMs / 1000}초)`));
    });

    req.on('error', (err) => {
      if (!timedOut) {
        reject(err);
      }
    });

    req.write(payload);
    req.end();
  });
}

export async function streamZaiChat(
  messages: ZaiChatMessage[],
  options: ZaiClientOptions
): Promise<string> {
  if (typeof fetch === 'function') {
    return streamWithFetch(messages, options);
  }

  return streamWithHttp(messages, options);
}
