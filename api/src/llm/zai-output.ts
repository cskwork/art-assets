import path from 'node:path';
import { normalizeJsonPayload } from './json-utils';

export interface GeneratedFile {
  path: string;
  content: string;
}

const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const REQUIRED_FILES = ['index.html', 'script.js', 'style.css'];
const DEFAULT_REQUIRED_PATHS = REQUIRED_FILES.map((name) => name);
const FILENAME_PATTERN_SOURCE = '[a-zA-Z0-9._-]+\\.(?:html|css|js|svg|png|jpg)';

/** Map code-fence language hints to default filenames */
const LANG_TO_DEFAULT_FILE: Record<string, string> = {
  html: 'index.html',
  htm: 'index.html',
  css: 'style.css',
  js: 'script.js',
  javascript: 'script.js',
  svg: 'inline.svg'
};

function normalizeRelativePath(filePath: string) {
  const normalized = path.posix.normalize(filePath).replace(/^(\.\/)+/, '');
  if (path.posix.isAbsolute(normalized)) {
    return null;
  }

  if (normalized === '..' || normalized.startsWith('../')) {
    return null;
  }

  return normalized;
}

export interface ParseZaiFilesOptions {
  moduleId: string;
  requireAll?: boolean;
  requiredFiles?: string[];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractPathFromText(value: string, moduleId: string): string | null {
  const modulePattern = new RegExp(
    `edu-content/${escapeRegExp(moduleId)}/[a-zA-Z0-9._/-]+\\.(?:html|css|js|svg|png|jpg)`,
    'g'
  );
  const fullMatches = [...value.matchAll(modulePattern)];
  if (fullMatches.length > 0) {
    return fullMatches[fullMatches.length - 1][0];
  }

  const fileNamePattern = new RegExp(`(${FILENAME_PATTERN_SOURCE})`, 'g');
  const fileNameMatches = [...value.matchAll(fileNamePattern)];
  if (fileNameMatches.length > 0) {
    const lastMatch = fileNameMatches[fileNameMatches.length - 1][1];
    return `edu-content/${moduleId}/${lastMatch}`;
  }

  return null;
}

/**
 * Infer a default filename from a code fence language hint.
 * e.g. "html" → "index.html", "javascript" → "script.js"
 */
function inferFileFromLang(lang: string): string | null {
  const normalized = lang.trim().toLowerCase().replace(/\s+/g, '');
  return LANG_TO_DEFAULT_FILE[normalized] ?? null;
}

/**
 * Infer filename from the actual content of a code block.
 * Uses heuristics based on content patterns.
 */
function inferFileFromContent(content: string): string | null {
  const trimmed = content.trimStart();

  // HTML detection
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    /^<head[\s>]/i.test(trimmed)
  ) {
    return 'index.html';
  }

  // CSS detection: starts with selectors, @rules, or :root
  if (/^(\*|body|html|:root|@import|@font-face|@media|\.[\w-]|#[\w-])/m.test(trimmed)) {
    // Make sure it's not JS that happens to have similar patterns
    if (!trimmed.includes('function') && !trimmed.includes('=>') && !trimmed.includes('const ')) {
      return 'style.css';
    }
  }

  // JS detection
  if (
    /^(\/\/|\/\*|'use strict'|"use strict"|import |export |const |let |var |function |class |document\.|window\.)/m.test(
      trimmed
    )
  ) {
    return 'script.js';
  }

  return null;
}

function extractFilesFromMarkdown(payload: string, moduleId: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const fencePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null = null;
  const usedDefaults = new Set<string>();

  while ((match = fencePattern.exec(payload)) !== null) {
    const infoString = match[1] ?? '';
    const content = match[2] ?? '';

    // Expand context search to 800 chars for broader heading detection
    const beforeContext = payload.slice(Math.max(0, match.index - 800), match.index);

    // Strategy 1: Find explicit file path in info string or context
    const pathFromInfo = extractPathFromText(infoString, moduleId);
    const pathFromContext = extractPathFromText(beforeContext, moduleId);
    let filePath = pathFromInfo || pathFromContext;

    // Only skip very short blocks when no explicit path was found
    // (short blocks with explicit paths are likely legitimate small files)
    if (!filePath && content.trim().length < 50) {
      continue;
    }

    // Strategy 2: Infer from language hint (```html → index.html)
    if (!filePath) {
      const langFile = inferFileFromLang(infoString);
      if (langFile && !usedDefaults.has(langFile)) {
        filePath = `edu-content/${moduleId}/${langFile}`;
        usedDefaults.add(langFile);
      }
    }

    // Strategy 3: Infer from content patterns
    if (!filePath) {
      const contentFile = inferFileFromContent(content);
      if (contentFile && !usedDefaults.has(contentFile)) {
        filePath = `edu-content/${moduleId}/${contentFile}`;
        usedDefaults.add(contentFile);
      }
    }

    if (!filePath) {
      continue;
    }

    files.push({
      path: filePath,
      content
    });
  }

  return deduplicateFiles(files);
}

/**
 * When multiple blocks resolve to the same path, keep the longest content.
 */
function deduplicateFiles(files: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();

  for (const file of files) {
    const existing = map.get(file.path);
    if (!existing || file.content.length > existing.content.length) {
      map.set(file.path, file);
    }
  }

  return [...map.values()];
}

export function parseZaiFiles(payload: string, options: ParseZaiFilesOptions): GeneratedFile[] {
  const requiredFiles = options.requiredFiles ?? DEFAULT_REQUIRED_PATHS;
  const normalizedPayload = normalizeJsonPayload(payload);
  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedPayload);
  } catch {
    // JSON parse failed — try markdown extraction
    const markdownFiles = extractFilesFromMarkdown(payload, options.moduleId);
    if (markdownFiles.length === 0) {
      throw new Error(
        `Z.ai 응답 JSON 파싱에 실패했습니다. 응답 길이: ${payload.length}자, 미리보기: ${payload.slice(0, 200)}`
      );
    }
    parsed = { files: markdownFiles };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Z.ai 응답 형식이 올바르지 않습니다.');
  }

  const record = parsed as { files?: unknown };
  if (!Array.isArray(record.files)) {
    // Last resort: maybe the JSON parsed but doesn't have a files array.
    // Try markdown extraction from original payload.
    const markdownFiles = extractFilesFromMarkdown(payload, options.moduleId);
    if (markdownFiles.length > 0) {
      record.files = markdownFiles;
    } else {
      throw new Error('Z.ai 응답에 files 배열이 필요합니다.');
    }
  }

  const normalizedFiles: GeneratedFile[] = [];
  const seen = new Set<string>();
  const required = new Set(requiredFiles.map((name) => `edu-content/${options.moduleId}/${name}`));

  for (const entry of record.files as unknown[]) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('파일 항목 형식이 올바르지 않습니다.');
    }

    const fileRecord = entry as { path?: unknown; content?: unknown };
    if (typeof fileRecord.path !== 'string' || typeof fileRecord.content !== 'string') {
      throw new Error('파일 경로와 내용은 문자열이어야 합니다.');
    }

    const normalizedPath = normalizeRelativePath(fileRecord.path);
    if (!normalizedPath) {
      throw new Error('허용되지 않는 파일 경로입니다.');
    }

    if (!normalizedPath.startsWith(`edu-content/${options.moduleId}/`)) {
      throw new Error('edu-content 경로만 허용됩니다.');
    }

    const extension = path.posix.extname(normalizedPath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error('허용되지 않는 확장자입니다.');
    }

    if (seen.has(normalizedPath)) {
      // Skip duplicates instead of throwing — keep the first one
      continue;
    }

    seen.add(normalizedPath);
    required.delete(normalizedPath);
    normalizedFiles.push({ path: normalizedPath, content: fileRecord.content });
  }

  if (options.requireAll !== false && required.size > 0) {
    const missing = [...required].map((p) => path.posix.basename(p)).join(', ');
    throw new Error(`필수 파일이 누락되었습니다: ${missing}`);
  }

  if (normalizedFiles.length === 0) {
    throw new Error('수정할 파일이 필요합니다.');
  }

  return normalizedFiles;
}

export function parseZaiOutput(payload: string, moduleId: string): GeneratedFile[] {
  return parseZaiFiles(payload, { moduleId, requireAll: true });
}
