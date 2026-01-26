import path from 'node:path';
import { normalizeJsonPayload } from './json-utils';

export interface GeneratedFile {
  path: string;
  content: string;
}

const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg']);
const REQUIRED_FILES = ['index.html', 'script.js', 'style.css'];

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

export function parseZaiOutput(payload: string, moduleId: string): GeneratedFile[] {
  const normalizedPayload = normalizeJsonPayload(payload);
  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedPayload);
  } catch (error) {
    throw new Error('Z.ai 응답 JSON 파싱에 실패했습니다.');
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
  const required = new Set(REQUIRED_FILES.map((name) => `edu-content/${moduleId}/${name}`));

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

    if (!normalizedPath.startsWith(`edu-content/${moduleId}/`)) {
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

  if (required.size > 0) {
    throw new Error('필수 파일이 누락되었습니다.');
  }

  return normalizedFiles;
}
