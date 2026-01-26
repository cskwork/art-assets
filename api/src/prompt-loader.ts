import fs from 'node:fs/promises';
import path from 'node:path';
import { GenerateContentRequest } from './types';

const SUBJECT_PROMPTS: Record<GenerateContentRequest['subject'], string> = {
  math: 'math.md',
  english: 'english.md'
};

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

export async function loadPromptTemplate(subject: GenerateContentRequest['subject']) {
  const fileName = SUBJECT_PROMPTS[subject];
  const promptPath = path.join(getProjectRoot(), 'prompts', fileName);
  return fs.readFile(promptPath, 'utf8');
}

export async function buildPrompt(
  request: GenerateContentRequest,
  moduleId: string
) {
  const template = await loadPromptTemplate(request.subject);

  return `${template}\n\n---\n\n## 생성 요청\n- 주제: ${request.topic}\n- 학년: ${request.gradeLevel}\n\n위 주제에 대한 7씬 교육 콘텐츠를 생성하고 edu-content/${moduleId}/ 폴더에 저장하세요.\n필수 파일: index.html, script.js, style.css\n`;
}
