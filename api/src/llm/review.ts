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
  'worksInBrowser',
  'responsiveDesign',
  'interactiveElements',
  'accessibilityBasic',
  'contentAccuracy',
  'quizPresent',
  'progressNavigation'
] as const;

export interface DeterministicReviewResult {
  pass: boolean;
  sceneCount: number;
  requirements: {
    sevenScenes: boolean;
    scriptReferenced: boolean;
    styleReferenced: boolean;
    langKo: boolean;
    responsiveDesign: boolean;
    interactiveElements: boolean;
    accessibilityBasic: boolean;
    quizPresent: boolean;
    progressNavigation: boolean;
    noConsoleErrors: boolean;
    notoSansKr: boolean;
    viewportMeta: boolean;
    noJustifyCenter: boolean;
    navPaddingBottom: boolean;
    consistentContainerWidth: boolean;
    noAbsoluteOverflow: boolean;
    svgQuotesOk: boolean;
    zIndexSanity: boolean;
    containerMaxWidth: boolean;
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

function checkResponsiveDesign(html: string, css: string): boolean {
  return /@media\s*\(/.test(css) || /max-width|min-width/.test(css);
}

function checkInteractiveElements(html: string, js: string): boolean {
  const hasButtons = /<button/i.test(html) || /\.addEventListener/i.test(js);
  const hasDragDrop = /draggable|ondrag|drag/i.test(html) || /drag|drop/i.test(js);
  const hasInputs = /<input|<select|<textarea/i.test(html);
  const hasClickHandlers = /onclick|click|addEventListener.*click/i.test(js);
  return hasButtons || hasDragDrop || hasInputs || hasClickHandlers;
}

function checkAccessibilityBasic(html: string): boolean {
  const hasAltText = /alt=["'][^"']+["']/i.test(html);
  const hasAriaLabels = /aria-label|aria-labelledby|role=/i.test(html);
  const hasSemanticTags = /<(main|section|header|nav|article|aside|footer)/i.test(html);
  // At least one accessibility feature present
  return hasAltText || hasAriaLabels || hasSemanticTags;
}

function checkQuizPresent(html: string, js: string): boolean {
  return /quiz/i.test(html) && (/checkAnswer|check.*answer|정답|오답|correct|incorrect/i.test(js));
}

function checkProgressNavigation(html: string, js: string): boolean {
  return /nextScene|prevScene|showScene|next.*scene|prev.*scene/i.test(js);
}

function checkNoConsoleErrors(js: string): boolean {
  // Check for common JS issues
  const hasUnclosedBrackets = (js.match(/\{/g) || []).length !== (js.match(/\}/g) || []).length;
  const hasUnclosedParens = (js.match(/\(/g) || []).length !== (js.match(/\)/g) || []).length;
  return !hasUnclosedBrackets && !hasUnclosedParens;
}

function checkNotoSansKr(html: string, css: string): boolean {
  return /Noto\s*Sans\s*KR/i.test(html) || /Noto\s*Sans\s*KR/i.test(css);
}

function checkViewportMeta(html: string): boolean {
  return /<meta[^>]+viewport[^>]+>/i.test(html);
}

function checkCssVariables(css: string): boolean {
  return /--primary|--secondary|--accent|:root/i.test(css);
}

function checkSceneMinContent(html: string): { pass: boolean; emptyScenes: string[] } {
  const emptyScenes: string[] = [];
  const scenePattern = /<section[^>]*id=["']([^"']*-scene)["'][^>]*>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = scenePattern.exec(html)) !== null) {
    const sceneId = match[1];
    const content = match[2].replace(/\s+/g, '').trim();
    if (content.length < 20) {
      emptyScenes.push(sceneId);
    }
  }
  return { pass: emptyScenes.length === 0, emptyScenes };
}

function checkNoJustifyCenter(css: string): boolean {
  // Check that .scene.active doesn't use justify-content: center
  // which causes content clipping when taller than viewport
  const sceneActiveMatch = css.match(/\.scene\.active\s*\{[^}]*\}/gi);
  if (!sceneActiveMatch) return true; // no .scene.active rule means we can't tell
  return !sceneActiveMatch.some(block => /justify-content\s*:\s*center/i.test(block));
}

function checkNavPaddingBottom(css: string): boolean {
  // Verify scenes have adequate bottom padding for fixed navigation
  const hasNavHeight = /--nav-height/i.test(css);
  const hasPaddingBottom = /padding-bottom\s*:/.test(css);
  return hasNavHeight || hasPaddingBottom;
}

function checkConsistentContainerWidth(html: string, css: string): boolean {
  // Check that a CSS variable or consistent max-width is used
  const hasContainerVar = /--container-max/i.test(css);
  const maxWidths = css.match(/max-width\s*:\s*(\d+)px/gi) || [];
  if (hasContainerVar) return true;
  // If more than 3 different max-width values, layout is inconsistent
  const uniqueWidths = new Set(maxWidths.map(m => m.match(/\d+/)?.[0]));
  return uniqueWidths.size <= 3;
}

function checkNoAbsoluteOverflow(html: string, css: string): boolean {
  // Check that position: absolute elements have overflow-hidden parents
  const absoluteCount = (css.match(/position\s*:\s*absolute/gi) || []).length;
  const overflowHidden = (css.match(/overflow\s*:\s*hidden/gi) || []).length;
  // If lots of absolute positioning without overflow containment, flag it
  if (absoluteCount > 3 && overflowHidden === 0) return false;
  return true;
}

function checkSvgQuotes(html: string): boolean {
  // Check for broken SVG attribute quoting (mixing " and ' in a single attribute)
  // Pattern: attribute="value' or attribute='value"
  const brokenQuotes = html.match(/(?:fill|stroke|style)="[^"]*'[^"]*"/gi);
  const brokenQuotes2 = html.match(/(?:fill|stroke|style)='[^']*"[^']*'/gi);
  return !brokenQuotes && !brokenQuotes2;
}

function checkZIndexSanity(css: string): boolean {
  // Check that no content elements use z-index > 100 (reserved for nav)
  const zIndexValues = css.match(/z-index\s*:\s*(\d+)/gi) || [];
  const highZIndex = zIndexValues.filter(z => {
    const val = parseInt(z.match(/\d+/)?.[0] || '0');
    return val > 500;
  });
  return highZIndex.length === 0;
}

function checkContainerMaxWidth(css: string): boolean {
  // Verify scene containers have width constraints
  const hasMaxWidth = /max-width/i.test(css);
  const hasWidthPercent = /width\s*:\s*100%/i.test(css);
  return hasMaxWidth || hasWidthPercent;
}

export function evaluateDeterministicReview(html: string, js?: string, css?: string): DeterministicReviewResult {
  const scriptContent = js || '';
  const styleContent = css || '';

  const sceneCount = countScenes(html);
  const sevenScenes = sceneCount >= 7;
  const scriptReferenced = /<script[^>]+src=["']script\.js["'][^>]*>/i.test(html);
  const styleReferenced = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']style\.css["'][^>]*>/i.test(html);
  const langKo = /<html[^>]+lang=["']ko["'][^>]*>/i.test(html);
  const responsiveDesign = checkResponsiveDesign(html, styleContent);
  const interactiveElements = checkInteractiveElements(html, scriptContent);
  const accessibilityBasic = checkAccessibilityBasic(html);
  const quizPresent = checkQuizPresent(html, scriptContent);
  const progressNavigation = checkProgressNavigation(html, scriptContent);
  const noConsoleErrors = checkNoConsoleErrors(scriptContent);
  const notoSansKr = checkNotoSansKr(html, styleContent);
  const viewportMeta = checkViewportMeta(html);

  // Layout quality checks
  const noJustifyCenter = checkNoJustifyCenter(styleContent);
  const navPaddingBottom = checkNavPaddingBottom(styleContent);
  const consistentContainerWidth = checkConsistentContainerWidth(html, styleContent);
  const noAbsoluteOverflow = checkNoAbsoluteOverflow(html, styleContent);
  const svgQuotesOk = checkSvgQuotes(html);
  const zIndexSanity = checkZIndexSanity(styleContent);
  const containerMaxWidth = checkContainerMaxWidth(styleContent);

  const issues: ReviewIssue[] = [];

  // Structure checks
  if (!sevenScenes) {
    issues.push(buildIssue(`씬이 7개 이상이어야 합니다. 현재 ${sceneCount}개입니다.`, 'index.html', 'high'));
  }
  if (!scriptReferenced) {
    issues.push(buildIssue('script.js가 HTML에 연결되어 있지 않습니다.', 'index.html', 'high'));
  }
  if (!styleReferenced) {
    issues.push(buildIssue('style.css가 HTML에 연결되어 있지 않습니다.', 'index.html', 'high'));
  }
  if (!langKo) {
    issues.push(buildIssue('HTML lang 속성이 ko로 설정되지 않았습니다.', 'index.html', 'high'));
  }

  // Visual/responsive checks
  if (!responsiveDesign) {
    issues.push(buildIssue('반응형 디자인(미디어 쿼리)이 없습니다.', 'style.css', 'medium'));
  }
  if (!notoSansKr) {
    issues.push(buildIssue('Noto Sans KR 폰트가 설정되지 않았습니다.', 'style.css', 'medium'));
  }
  if (!viewportMeta) {
    issues.push(buildIssue('viewport meta 태그가 없습니다.', 'index.html', 'high'));
  }

  // Interaction checks
  if (!interactiveElements) {
    issues.push(buildIssue('인터랙티브 요소(버튼, 드래그, 입력)가 없습니다.', 'script.js', 'high'));
  }
  if (!quizPresent) {
    issues.push(buildIssue('퀴즈 기능이 구현되지 않았습니다.', 'script.js', 'medium'));
  }
  if (!progressNavigation) {
    issues.push(buildIssue('씬 전환 네비게이션이 없습니다.', 'script.js', 'high'));
  }

  // Accessibility checks
  if (!accessibilityBasic) {
    issues.push(buildIssue('기본 접근성 기능(alt, aria, 시맨틱 태그)이 부족합니다.', 'index.html', 'low'));
  }

  // Code quality checks
  if (!noConsoleErrors) {
    issues.push(buildIssue('JavaScript 괄호 불일치가 감지되었습니다.', 'script.js', 'high'));
  }

  // Scene content check
  const sceneCheck = checkSceneMinContent(html);
  if (!sceneCheck.pass) {
    sceneCheck.emptyScenes.forEach(sceneId => {
      issues.push(buildIssue(`${sceneId}의 콘텐츠가 너무 적습니다.`, 'index.html', 'medium'));
    });
  }

  // Layout quality issues
  if (!noJustifyCenter) {
    issues.push(buildIssue('.scene.active에 justify-content: center가 있어 콘텐츠 길 때 위쪽이 잘립니다. flex-start로 변경하세요.', 'style.css', 'high'));
  }
  if (!navPaddingBottom) {
    issues.push(buildIssue('고정 네비게이션을 위한 padding-bottom이 부족합니다.', 'style.css', 'medium'));
  }
  if (!consistentContainerWidth) {
    issues.push(buildIssue('씬 컨테이너의 max-width가 일관적이지 않습니다. CSS 변수를 사용하세요.', 'style.css', 'medium'));
  }
  if (!noAbsoluteOverflow) {
    issues.push(buildIssue('position: absolute 요소가 overflow: hidden 없이 사용되어 겹침이 발생합니다.', 'style.css', 'high'));
  }
  if (!svgQuotesOk) {
    issues.push(buildIssue('SVG 속성에 따옴표 혼용이 있어 렌더링이 깨집니다.', 'index.html', 'high'));
  }
  if (!zIndexSanity) {
    issues.push(buildIssue('z-index가 500 이상인 요소가 있어 레이어 충돌 위험이 있습니다.', 'style.css', 'low'));
  }
  if (!containerMaxWidth) {
    issues.push(buildIssue('컨테이너에 max-width 제한이 없어 넓은 화면에서 레이아웃이 깨집니다.', 'style.css', 'medium'));
  }

  const requirements = {
    sevenScenes,
    scriptReferenced,
    styleReferenced,
    langKo,
    responsiveDesign,
    interactiveElements,
    accessibilityBasic,
    quizPresent,
    progressNavigation,
    noConsoleErrors,
    notoSansKr,
    viewportMeta,
    noJustifyCenter,
    navPaddingBottom,
    consistentContainerWidth,
    noAbsoluteOverflow,
    svgQuotesOk,
    zIndexSanity,
    containerMaxWidth
  };

  // Core requirements (high severity) must all pass
  const corePass = sevenScenes && scriptReferenced && styleReferenced && langKo && viewportMeta && progressNavigation;

  return {
    pass: corePass,
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
    `- responsiveDesign: ${deterministic.requirements.responsiveDesign}`,
    `- interactiveElements: ${deterministic.requirements.interactiveElements}`,
    `- accessibilityBasic: ${deterministic.requirements.accessibilityBasic}`,
    `- quizPresent: ${deterministic.requirements.quizPresent}`,
    `- progressNavigation: ${deterministic.requirements.progressNavigation}`,
    `- noConsoleErrors: ${deterministic.requirements.noConsoleErrors}`,
    `- notoSansKr: ${deterministic.requirements.notoSansKr}`,
    `- viewportMeta: ${deterministic.requirements.viewportMeta}`,
    `- noJustifyCenter: ${deterministic.requirements.noJustifyCenter}`,
    `- navPaddingBottom: ${deterministic.requirements.navPaddingBottom}`,
    `- consistentContainerWidth: ${deterministic.requirements.consistentContainerWidth}`,
    `- noAbsoluteOverflow: ${deterministic.requirements.noAbsoluteOverflow}`,
    `- svgQuotesOk: ${deterministic.requirements.svgQuotesOk}`,
    `- zIndexSanity: ${deterministic.requirements.zIndexSanity}`,
    `- containerMaxWidth: ${deterministic.requirements.containerMaxWidth}`,
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
    '    "worksInBrowser": true,',
    '    "responsiveDesign": true,',
    '    "interactiveElements": true,',
    '    "accessibilityBasic": true,',
    '    "contentAccuracy": true,',
    '    "quizPresent": true,',
    '    "progressNavigation": true',
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

export function buildFixMessages(
  prompt: string,
  files: ReviewFiles,
  review: ReviewResult,
  deterministic: DeterministicReviewResult
): ZaiChatMessage[] {
  const issueList = review.issues.length
    ? review.issues.map((issue, index) => `${index + 1}. [${issue.severity}] ${issue.location} - ${issue.message}`).join('\n')
    : '이슈 없음';

  const deterministicSummary = [
    `자동 점검: sevenScenes=${deterministic.requirements.sevenScenes}, scriptReferenced=${deterministic.requirements.scriptReferenced}, styleReferenced=${deterministic.requirements.styleReferenced}, langKo=${deterministic.requirements.langKo}, responsiveDesign=${deterministic.requirements.responsiveDesign}, interactiveElements=${deterministic.requirements.interactiveElements}, accessibilityBasic=${deterministic.requirements.accessibilityBasic}, quizPresent=${deterministic.requirements.quizPresent}, progressNavigation=${deterministic.requirements.progressNavigation}, noConsoleErrors=${deterministic.requirements.noConsoleErrors}, notoSansKr=${deterministic.requirements.notoSansKr}, viewportMeta=${deterministic.requirements.viewportMeta}, noJustifyCenter=${deterministic.requirements.noJustifyCenter}, navPaddingBottom=${deterministic.requirements.navPaddingBottom}, consistentContainerWidth=${deterministic.requirements.consistentContainerWidth}, noAbsoluteOverflow=${deterministic.requirements.noAbsoluteOverflow}, svgQuotesOk=${deterministic.requirements.svgQuotesOk}, zIndexSanity=${deterministic.requirements.zIndexSanity}, containerMaxWidth=${deterministic.requirements.containerMaxWidth}, sceneCount=${deterministic.sceneCount}`
  ].join('\n');

  const responseSchema = [
    '{',
    '  "files": [',
    '    { "path": "edu-content/모듈ID/index.html", "content": "..." },',
    '    { "path": "edu-content/모듈ID/script.js", "content": "..." },',
    '    { "path": "edu-content/모듈ID/style.css", "content": "..." }',
    '  ]',
    '}'
  ].join('\n');

  const userContent = [
    '다음 콘텐츠의 문제를 수정하세요.',
    '필요한 파일만 수정하여 JSON만 출력하세요.',
    'JSON 외의 텍스트는 금지입니다.',
    '',
    '이슈 목록:',
    issueList,
    '',
    '요약:',
    review.summary,
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
    files.styleCss
  ].join('\n');

  return [
    {
      role: 'system',
      content: '당신은 교육용 웹 콘텐츠의 수정 담당자입니다.'
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
