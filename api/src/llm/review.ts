import { normalizeJsonPayload } from './json-utils';
import { ReviewIssue, ReviewResult } from '../types';
import { ZaiChatMessage } from './zai-client';

const REVIEW_REQUIREMENT_KEYS = [
  'sevenScenes',
  'scriptReferenced',
  'styleReferenced',
  'langKo',
  'koreanOnly',
  'logicalCorrectness',
  'worksInBrowser'
] as const;

export interface DeterministicReviewResult {
  pass: boolean;
  sceneCount: number;
  requirements: {
    sevenScenes: boolean;
    scriptReferenced: boolean;
    styleReferenced: boolean;
    langKo: boolean;
  };
  issues: ReviewIssue[];
}

export interface ReviewFiles {
  indexHtml: string;
  scriptJs: string;
  styleCss: string;
}

function countScenes(html: string) {
  const matches = html.match(/class=["'][^"']*\bscene\b[^"']*["']/gi);
  return matches ? matches.length : 0;
}

function buildIssue(message: string, location = 'index.html', severity: ReviewIssue['severity'] = 'high') {
  return { severity, location, message };
}

export function evaluateDeterministicReview(html: string): DeterministicReviewResult {
  const sceneCount = countScenes(html);
  const sevenScenes = sceneCount >= 7;
  const scriptReferenced = /<script[^>]+src=["']script\.js["'][^>]*>/i.test(html);
  const styleReferenced = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']style\.css["'][^>]*>/i.test(html);
  const langKo = /<html[^>]+lang=["']ko["'][^>]*>/i.test(html);

  const issues: ReviewIssue[] = [];
  if (!sevenScenes) {
    issues.push(buildIssue(`씬이 7개 이상이어야 합니다. 현재 ${sceneCount}개입니다.`));
  }
  if (!scriptReferenced) {
    issues.push(buildIssue('script.js가 HTML에 연결되어 있지 않습니다.'));
  }
  if (!styleReferenced) {
    issues.push(buildIssue('style.css가 HTML에 연결되어 있지 않습니다.'));
  }
  if (!langKo) {
    issues.push(buildIssue('HTML lang 속성이 ko로 설정되지 않았습니다.'));
  }

  const requirements = {
    sevenScenes,
    scriptReferenced,
    styleReferenced,
    langKo
  };

  const pass = Object.values(requirements).every(Boolean);

  return {
    pass,
    sceneCount,
    requirements,
    issues
  };
}

export function buildReviewMessages(
  prompt: string,
  files: ReviewFiles,
  deterministic: DeterministicReviewResult
): ZaiChatMessage[] {
  const requirementText = REVIEW_REQUIREMENT_KEYS.map((key) => `- ${key}`).join('\n');
  const deterministicSummary = [
    `자동 점검 결과:`,
    `- sevenScenes: ${deterministic.requirements.sevenScenes}`,
    `- scriptReferenced: ${deterministic.requirements.scriptReferenced}`,
    `- styleReferenced: ${deterministic.requirements.styleReferenced}`,
    `- langKo: ${deterministic.requirements.langKo}`,
    `- sceneCount: ${deterministic.sceneCount}`
  ].join('\n');

  const responseSchema = [
    '{',
    '  "pass": true,',
    '  "score": 0,',
    '  "requirements": {',
    '    "sevenScenes": true,',
    '    "scriptReferenced": true,',
    '    "styleReferenced": true,',
    '    "langKo": true,',
    '    "koreanOnly": true,',
    '    "logicalCorrectness": true,',
    '    "worksInBrowser": true',
    '  },',
    '  "issues": [',
    '    { "severity": "high", "location": "index.html", "message": "설명", "fix": "수정안" }',
    '  ],',
    '  "summary": "요약"',
    '}'
  ].join('\n');

  const userContent = [
    '다음 생성 결과가 요구사항을 충족하는지 리뷰하세요.',
    '논리적 정확성과 브라우저 동작 가능성까지 평가하세요.',
    '응답은 JSON만 출력하세요. 다른 텍스트는 금지입니다.',
    'requirements 키는 아래 목록을 모두 포함해야 합니다.',
    requirementText,
    '',
    deterministicSummary,
    '',
    '응답 형식 예시:',
    responseSchema,
    '',
    '프롬프트:',
    prompt,
    '',
    'index.html:',
    files.indexHtml,
    '',
    'script.js:',
    files.scriptJs,
    '',
    'style.css:',
    files.styleCss,
  ].join('\n');

  return [
    {
      role: 'system',
      content: '당신은 교육용 웹 콘텐츠의 검수자입니다.'
    },
    {
      role: 'user',
      content: userContent
    }
  ];
}

function parseIssue(input: unknown, index: number): ReviewIssue {
  if (!input || typeof input !== 'object') {
    throw new Error(`리뷰 이슈 형식이 올바르지 않습니다: ${index}`);
  }

  const record = input as { severity?: unknown; location?: unknown; message?: unknown; fix?: unknown };
  const severity = record.severity;
  const location = record.location;
  const message = record.message;
  const fix = record.fix;

  if (severity !== 'high' && severity !== 'medium' && severity !== 'low') {
    throw new Error(`리뷰 이슈 심각도가 올바르지 않습니다: ${index}`);
  }
  if (typeof location !== 'string' || location.trim().length === 0) {
    throw new Error(`리뷰 이슈 위치가 필요합니다: ${index}`);
  }
  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new Error(`리뷰 이슈 메시지가 필요합니다: ${index}`);
  }

  if (fix !== undefined && typeof fix !== 'string') {
    throw new Error(`리뷰 이슈 수정안은 문자열이어야 합니다: ${index}`);
  }

  return {
    severity,
    location,
    message,
    ...(fix ? { fix } : {})
  };
}

export function parseReviewOutput(payload: string): ReviewResult {
  const normalizedPayload = normalizeJsonPayload(payload);
  let parsed: unknown;

  try {
    parsed = JSON.parse(normalizedPayload);
  } catch (error) {
    throw new Error('리뷰 응답 JSON 파싱에 실패했습니다.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('리뷰 응답 형식이 올바르지 않습니다.');
  }

  const record = parsed as {
    pass?: unknown;
    score?: unknown;
    requirements?: unknown;
    issues?: unknown;
    summary?: unknown;
  };

  if (typeof record.pass !== 'boolean') {
    throw new Error('리뷰 pass 값이 필요합니다.');
  }
  if (typeof record.score !== 'number' || !Number.isFinite(record.score)) {
    throw new Error('리뷰 score 값이 필요합니다.');
  }
  if (!record.requirements || typeof record.requirements !== 'object') {
    throw new Error('리뷰 requirements 값이 필요합니다.');
  }
  if (!Array.isArray(record.issues)) {
    throw new Error('리뷰 issues 배열이 필요합니다.');
  }
  if (typeof record.summary !== 'string') {
    throw new Error('리뷰 summary 값이 필요합니다.');
  }

  const requirements = record.requirements as Record<string, unknown>;
  REVIEW_REQUIREMENT_KEYS.forEach((key) => {
    if (typeof requirements[key] !== 'boolean') {
      throw new Error(`리뷰 requirements.${key} 값이 필요합니다.`);
    }
  });

  const issues = record.issues.map((issue, index) => parseIssue(issue, index));

  return {
    pass: record.pass,
    score: record.score,
    requirements: requirements as Record<string, boolean>,
    issues,
    summary: record.summary
  };
}
