import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { TextDecoder } from 'node:util';

export interface ZaiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZaiClientOptions {
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

const DEFAULT_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4.7';

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
  const response = await fetch(options.apiUrl ?? DEFAULT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Z.ai API 오류: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Z.ai 응답 스트림을 읽을 수 없습니다.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

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
    if (result.done) {
      return content;
    }
  }

  return content;
}

async function streamWithHttp(
  messages: ZaiChatMessage[],
  options: ZaiClientOptions
) {
  const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
  const payload = JSON.stringify({
    model: options.model ?? DEFAULT_MODEL,
    messages,
    stream: true
  });
  const url = new URL(apiUrl);
  const requestFn = url.protocol === 'https:' ? https.request : http.request;

  return new Promise<string>((resolve, reject) => {
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
        }
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
            const detail = errorBody ? ` - ${errorBody}` : '';
            reject(new Error(`Z.ai API 오류: ${statusCode} ${statusMessage}${detail}`));
          });
          return;
        }

        let resolved = false;
        let buffer = '';
        let content = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          const result = processSseLines(lines, content);
          content = result.content;
          if (result.done && !resolved) {
            resolved = true;
            res.destroy();
            resolve(content);
          }
        });
        res.on('end', () => {
          if (!resolved) {
            resolve(content);
          }
        });
      }
    );

    req.on('error', reject);
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
