import fs from 'node:fs/promises';
import path from 'node:path';
import { GenerateContentRequest } from './types';

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

/**
 * 공통 시스템 프롬프트 로드
 * api/system-prompt/system.md 파일 사용
 */
export async function loadSystemPrompt() {
  const promptPath = path.join(getProjectRoot(), 'api', 'system-prompt', 'system.md');
  return fs.readFile(promptPath, 'utf8');
}

/**
 * 최종 프롬프트 생성
 * 공통 시스템 프롬프트 + 과목/주제별 요청
 */
export async function buildPrompt(
  request: GenerateContentRequest,
  moduleId: string
) {
  const systemPrompt = await loadSystemPrompt();

  return `${systemPrompt}\n\n---\n\n## 생성 요청\n- 과목: ${request.subject}\n- 주제: ${request.topic}\n- 학년: ${request.gradeLevel}\n\n위 주제에 대한 7씬 교육 콘텐츠를 생성하고 edu-content/${moduleId}/ 폴더에 저장하세요.\n필수 파일: index.html, script.js, style.css\n`;
}
