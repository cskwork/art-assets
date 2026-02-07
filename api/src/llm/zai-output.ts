import path from 'node:path';
import { normalizeJsonPayload } from './json-utils';

export interface GeneratedFile {
  path: string;
  content: string;
}

const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const REQUIRED_FILES = ['index.html', 'script.js', 'style.css'];
const DEFAULT_REQUIRED_PATHS = REQUIRED_FILES.map((name) => name);
const FILENAME_PATTERN = /(?:^|[\\/])([a-zA-Z0-9._-]+\.(?:html|css|js|svg|png|jpg))(?:$|[\s"'`)>\]])/;

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

  const fileNameMatch = value.match(FILENAME_PATTERN);
  if (fileNameMatch?.[1]) {
    return `edu-content/${moduleId}/${fileNameMatch[1]}`;
  }

  return null;
}

function extractFilesFromMarkdown(payload: string, moduleId: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const fencePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null = null;

  while ((match = fencePattern.exec(payload)) !== null) {
    const infoString = match[1] ?? '';
    const content = match[2] ?? '';
    const beforeContext = payload.slice(Math.max(0, match.index - 400), match.index);
    const pathFromInfo = extractPathFromText(infoString, moduleId);
    const pathFromContext = extractPathFromText(beforeContext, moduleId);
    const filePath = pathFromInfo || pathFromContext;

    if (!filePath) {
      continue;
    }

    files.push({
      path: filePath,
      content,
    });
  }

  return files;
}

export function parseZaiFiles(payload: string, options: ParseZaiFilesOptions): GeneratedFile[] {
  const requiredFiles = options.requiredFiles ?? DEFAULT_REQUIRED_PATHS;
  const normalizedPayload = normalizeJsonPayload(payload);
  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedPayload);
  } catch {
    const markdownFiles = extractFilesFromMarkdown(payload, options.moduleId);
    if (markdownFiles.length === 0) {
      throw new Error('Z.ai 응답 JSON 파싱에 실패했습니다.');
    }
    parsed = { files: markdownFiles };
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Z.ai 응답 형식이 올바르지 않습니다.');
  }

  const record = parsed as { files?: unknown };
  if (!Array.isArray(record.files)) {
    throw new Error('Z.ai 응답에 files 배열이 필요합니다.');
  }

  const normalizedFiles: GeneratedFile[] = [];
  const seen = new Set<string>();
  const required = new Set(requiredFiles.map((name) => `edu-content/${options.moduleId}/${name}`));

  for (const entry of record.files) {
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
      throw new Error('중복된 파일 경로가 포함되었습니다.');
    }

    seen.add(normalizedPath);
    required.delete(normalizedPath);
    normalizedFiles.push({ path: normalizedPath, content: fileRecord.content });
  }

  if (options.requireAll !== false && required.size > 0) {
    throw new Error('필수 파일이 누락되었습니다.');
  }

  if (normalizedFiles.length === 0) {
    throw new Error('수정할 파일이 필요합니다.');
  }

  return normalizedFiles;
}

export function parseZaiOutput(payload: string, moduleId: string): GeneratedFile[] {
  return parseZaiFiles(payload, { moduleId, requireAll: true });
}
