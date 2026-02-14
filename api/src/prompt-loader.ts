import fs from 'node:fs/promises';
import path from 'node:path';
import { GenerateContentRequest, Subject } from './types';

function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}

type AssetCandidate = {
  path: string;
  tags: string[];
  description: string;
};

const MAX_CORE_ASSETS = 10;
const MAX_EIGHT_BIT_ASSETS = 14;
const TOKEN_MIN_LENGTH = 2;

const SUBJECT_KEYWORDS: Record<Subject, string[]> = {
  math: ['math', 'geometry', 'fraction', 'graph', 'number', 'shape', '수학', '도형', '분수', '그래프', '숫자'],
  english: ['english', 'word', 'vocabulary', 'grammar', 'alphabet', '영어', '단어', '문법', '알파벳', '문장'],
  science: ['science', 'biology', 'chemistry', 'physics', 'planet', '과학', '생물', '화학', '물리', '행성'],
  social: ['social', 'society', 'economy', 'democracy', 'culture', '사회', '경제', '민주주의', '문화', '지역'],
  history: ['history', 'war', 'dynasty', 'civilization', 'revolution', '역사', '전쟁', '왕조', '문명', '혁명'],
  korean: ['korean', 'grammar', 'writing', 'reading', 'poem', '국어', '문법', '글쓰기', '독서', '시'],
  art: ['art', 'painting', 'drawing', 'color', 'design', '미술', '그림', '색', '디자인', '조각'],
  music: ['music', 'rhythm', 'melody', 'instrument', 'note', '음악', '리듬', '멜로디', '악기', '음표'],
  coding: ['coding', 'programming', 'algorithm', 'variable', 'loop', '코딩', '프로그래밍', '알고리즘', '변수', '반복문']
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'from',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  '초등',
  '중학교',
  '고등학교',
  '학년'
]);

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/g)
    .filter((token) => token.length >= TOKEN_MIN_LENGTH && !STOP_WORDS.has(token));
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function toAssetCandidate(value: unknown): AssetCandidate | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const assetPath = record.path;
  const description = record.description;
  if (typeof assetPath !== 'string' || assetPath.trim().length === 0) {
    return null;
  }
  if (typeof description !== 'string' || description.trim().length === 0) {
    return null;
  }

  return {
    path: assetPath.trim().replace(/\\/g, '/'),
    tags: normalizeTags(record.tags),
    description: description.trim()
  };
}

async function loadJsonFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function loadCoreAssetCandidates(projectRoot: string) {
  const payload = await loadJsonFile(path.join(projectRoot, 'assets.json'));
  if (!payload || typeof payload !== 'object') {
    return [] as AssetCandidate[];
  }

  const assets = (payload as { assets?: unknown }).assets;
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((entry) => toAssetCandidate(entry))
    .filter((entry): entry is AssetCandidate => Boolean(entry));
}

async function loadEightBitAssetCandidates(projectRoot: string) {
  const payload = await loadJsonFile(path.join(projectRoot, '8bit-assets', 'index.json'));
  if (!payload || typeof payload !== 'object') {
    return [] as AssetCandidate[];
  }

  const assets = (payload as { assets?: unknown }).assets;
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((entry) => toAssetCandidate(entry))
    .filter((entry): entry is AssetCandidate => Boolean(entry));
}

function scoreCandidate(candidate: AssetCandidate, keywordTokens: Set<string>) {
  if (keywordTokens.size === 0) {
    return 0;
  }

  const pathText = candidate.path.toLowerCase();
  const descText = candidate.description.toLowerCase();
  const tagText = candidate.tags.join(' ').toLowerCase();
  let score = 0;

  keywordTokens.forEach((token) => {
    if (tagText.includes(token)) {
      score += 4;
    }
    if (pathText.includes(token)) {
      score += 3;
    }
    if (descText.includes(token)) {
      score += 2;
    }
  });

  return score;
}

function selectAssetCandidates(
  candidates: AssetCandidate[],
  keywordTokens: Set<string>,
  limit: number
) {
  const scored = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, keywordTokens) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.candidate.path.localeCompare(b.candidate.path);
    });

  const filtered = scored.filter((entry) => entry.score > 0);
  if (filtered.length > 0) {
    return filtered.slice(0, limit).map((entry) => entry.candidate);
  }

  return scored.slice(0, limit).map((entry) => entry.candidate);
}

function toPathLabel(assetPath: string) {
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
}

function formatAssetLine(candidate: AssetCandidate) {
  const tags = candidate.tags.slice(0, 5).join(', ');
  if (tags.length === 0) {
    return `- ${toPathLabel(candidate.path)} | 설명: ${candidate.description}`;
  }

  return `- ${toPathLabel(candidate.path)} | 설명: ${candidate.description} | 태그: ${tags}`;
}

function collectKeywordTokens(request: GenerateContentRequest) {
  const seed = [
    request.topic,
    request.gradeLevel,
    request.subject,
    ...SUBJECT_KEYWORDS[request.subject]
  ].join(' ');

  return new Set(tokenize(seed));
}

async function buildArtAssetContext(request: GenerateContentRequest) {
  const shouldUseArtAssets = request.useArtAssets !== false;
  if (!shouldUseArtAssets) {
    return '';
  }

  const projectRoot = getProjectRoot();
  const [coreAssets, eightBitAssets] = await Promise.all([
    loadCoreAssetCandidates(projectRoot),
    loadEightBitAssetCandidates(projectRoot)
  ]);
  const keywordTokens = collectKeywordTokens(request);
  const selectedCore = selectAssetCandidates(coreAssets, keywordTokens, MAX_CORE_ASSETS);
  const selectedEightBit = selectAssetCandidates(eightBitAssets, keywordTokens, MAX_EIGHT_BIT_ASSETS);

  const lines: string[] = [
    '## 아트 에셋 사용 지침',
    '- 아래 경로의 기존 에셋을 우선 사용하고, 필요한 경우에만 새 SVG를 생성하세요.',
    '- HTML/CSS/JS에서 경로는 절대 경로(`/...`)로 참조하세요.',
    '- 8비트 에셋 루트: /8bit-assets/'
  ];

  if (selectedCore.length > 0) {
    lines.push('', '### 기본 아트 에셋 추천');
    selectedCore.forEach((candidate) => {
      lines.push(formatAssetLine(candidate));
    });
  }

  if (selectedEightBit.length > 0) {
    lines.push('', '### 8비트 아트 에셋 추천');
    selectedEightBit.forEach((candidate) => {
      lines.push(formatAssetLine(candidate));
    });
  }

  return `${lines.join('\n')}\n`;
}

function buildContentTypeInstructions(contentType?: string): string {
  const instructions: Record<string, string> = {
    'phaser': `## 콘텐츠 유형: Phaser 2D 게임
- Phaser 3.x CDN 사용 (https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js)
- Scene 클래스 기반 구조, 아케이드 물리 엔진
- 게임 메카닉: 점수, 콤보, 타이머, 레벨 시스템
- 드래그앤드롭, 터치 입력 지원
- 레이아웃: #phaser-game 컨테이너에 max-width: var(--container-max); margin: 0 auto
- 게임 캔버스 크기: Math.min(600, window.innerWidth - 40) 동적 계산
- 게임 UI는 Phaser 내부에, 외부 컨트롤은 HTML로 분리
- resize 이벤트에서 game.scale.resize() 호출`,
    'threejs': `## 콘텐츠 유형: Three.js 3D 시각화
- Three.js r160+ CDN (ES Modules 또는 전역 window.THREE)
- OrbitControls로 3D 인터랙션, 마우스/터치 회전
- 슬라이더/드래그로 3D 모델 매개변수 실시간 조작
- 레이아웃: 3D 캔버스 컨테이너에 max-width: var(--container-max); aspect-ratio: 16/10
- 컨트롤 패널은 캔버스 아래 배치, position: absolute 사용 금지
- 카메라 초기 위치와 lookAt 설정 필수
- 조명: AmbientLight + DirectionalLight 최소 구성
- window resize 핸들러에서 camera.aspect와 renderer.setSize 업데이트`,
    'canvas-2d': `## 콘텐츠 유형: Canvas 2D
- HTML5 Canvas API 사용, requestAnimationFrame 루프
- 커스텀 그래픽 렌더링, 터치/마우스 이벤트 통합
- 레이아웃: canvas에 max-width: 100%; height: auto; display: block; margin: 0 auto
- 캔버스 해상도: devicePixelRatio 고려한 고해상도 렌더링
- 터치 이벤트: touchstart/touchmove/touchend + preventDefault()
- 컨트롤/텍스트는 HTML 요소로 캔버스 밖에 배치`,
    'svg-animation': `## 콘텐츠 유형: SVG 애니메이션
- 인라인 SVG + CSS/JS 애니메이션
- SVG 속성은 큰따옴표(")만 사용, 작은따옴표 혼용 금지
- viewBox 설정으로 반응형 SVG
- 레이아웃: SVG에 width="100%" max-width 제한, height="auto"
- CSS @keyframes 또는 JS requestAnimationFrame으로 애니메이션
- 인터랙티브 SVG: pointer-events 설정`,
    'css-animation': `## 콘텐츠 유형: CSS 애니메이션
- CSS transform/transition/animation 활용
- 순수 CSS 기반 시각 효과, JavaScript 최소 사용
- 레이아웃: flexbox/grid 기반, absolute 최소화
- 하드웨어 가속: transform, opacity 중심 애니메이션
- prefers-reduced-motion 미디어 쿼리로 접근성 지원`,
    'pixel-art': `## 콘텐츠 유형: 픽셀 아트 스타일
- 8비트/16비트 레트로 게임 스타일
- Canvas 기반 픽셀 렌더링, image-rendering: pixelated
- 레이아웃: 캔버스를 정수 배율로 스케일, 흐림 방지
- 저해상도 캔버스 + CSS 확대 기법
- 레트로 사운드 효과 (Web Audio API)`,
    'isometric': `## 콘텐츠 유형: 아이소메트릭 2.5D
- 아이소메트릭 좌표 변환 (x' = (x-y)*cos30, y' = (x+y)*sin30)
- 깊이 정렬 기반 렌더링, 타일 맵 구조
- 레이아웃: 캔버스 중앙 정렬, 줌/팬 컨트롤
- 타일 크기 일관성 유지`
  };
  if (!contentType || !instructions[contentType]) return '';
  return instructions[contentType] + '\n\n';
}

function buildVisualStyleInstructions(visualStyle?: string): string {
  const styles: Record<string, string> = {
    'modern-flat': `## 비주얼 스타일: 모던 플랫
- 깔끔한 플랫 디자인, 밝은 파스텔 색상 팔레트
- 그림자: var(--shadow-sm) ~ var(--shadow-md) 단계적 사용
- border-radius: var(--radius-md) 통일, 둥근 카드 UI
- 아이콘 기반 UI, 여백 충분히 확보 (spacing 변수 활용)
- 색상 대비: 텍스트/배경 4.5:1 이상`,
    'pixel-art': `## 비주얼 스타일: 픽셀 아트
- 8비트/16비트 레트로 그래픽, 제한 색상 팔레트(16-32색)
- image-rendering: pixelated 필수 적용
- 픽셀 완벽한 정렬, 서브픽셀 렌더링 방지
- 비트맵 스타일 UI 요소, 격자 기반 레이아웃`,
    'isometric': `## 비주얼 스타일: 아이소메트릭
- 30도 각도의 아이소메트릭 뷰, 타일 기반 배경
- 깊이감 있는 레이어링, 그림자로 높이 표현
- 일관된 타일 크기와 간격`,
    'hand-drawn': `## 비주얼 스타일: 손그림 스타일
- 스케치/수채화 느낌, 불규칙한 선과 따뜻한 색감
- SVG filter로 연필/크레용 텍스처 효과
- 노트북/칠판 배경, 친근하고 자연스러운 분위기`,
    'watercolor': `## 비주얼 스타일: 수채화
- 부드러운 그라데이션, 투명한 레이어 효과
- SVG feGaussianBlur, feTurbulence 필터 활용
- 자연스러운 색 번짐, 예술적 분위기`,
    'neon-glow': `## 비주얼 스타일: 네온 글로우
- 어두운 배경(#0a0a1a)에 네온 색상(#00ffff, #ff00ff, #ffff00)
- text-shadow와 box-shadow로 글로우/블룸 효과
- 사이버펑크 분위기, 빛나는 테두리와 애니메이션
- 배경은 어둡게, 포커스 요소에만 네온 적용`,
    'retro-arcade': `## 비주얼 스타일: 레트로 아케이드
- 80년대 아케이드 게임 스타일, CRT 스캔라인 효과
- 비트맵 폰트 (Press Start 2P 등), 하이스코어 보드 UI
- 화면 글로우 효과, 도트 매트릭스 패턴`,
    'cartoon-3d': `## 비주얼 스타일: 카툰 3D
- 만화 같은 3D 렌더링, 밝은 색상과 굵은 아웃라인
- 과장된 비율과 표정, 재미있고 친근한 분위기
- Three.js toon shader 또는 CSS 3D transform 활용`,
    'minimal-clean': `## 비주얼 스타일: 미니멀 클린
- 최소한의 디자인 요소, 넉넉한 여백 (spacing-xl 활용)
- 단색 + 강조색 1개만 사용
- 타이포그래피 중심, 큰 폰트 사이즈와 넓은 행간
- 카드/테두리 최소화, 여백으로 구분`
  };
  if (!visualStyle || !styles[visualStyle]) return '';
  return styles[visualStyle] + '\n\n';
}

function buildStoryThemeInstructions(storyTheme?: string): string {
  const themes: Record<string, string> = {
    'adventure': '## 스토리 테마: 모험\n- 탐험과 발견의 서사\n- 보물찾기/퀘스트 구조\n- 용감한 탐험가 캐릭터\n- 단계별 도전 과제',
    'mystery': '## 스토리 테마: 미스터리\n- 수수께끼와 단서 해결\n- 탐정/수사관 캐릭터\n- 추리를 통한 학습\n- 반전과 발견의 순간',
    'sci-fi': '## 스토리 테마: SF\n- 미래 우주/기술 배경\n- 로봇/AI 조수 캐릭터\n- 과학 기술 기반 문제 해결\n- 우주 탐사/시간여행 설정',
    'daily-life': '## 스토리 테마: 일상생활\n- 학교/가정/동네 배경\n- 또래 친구 캐릭터\n- 실생활 문제 해결\n- 공감하기 쉬운 상황',
    'historical': '## 스토리 테마: 역사\n- 역사적 사건/시대 배경\n- 역사 인물 등장\n- 시대적 맥락에서 학습\n- 타임트래블 요소 가능',
    'fantasy': '## 스토리 테마: 판타지\n- 마법의 세계 배경\n- 마법사/요정 캐릭터\n- 마법으로 표현되는 학습 개념\n- 퀘스트와 보상 시스템',
    'sports': '## 스토리 테마: 스포츠\n- 운동/경기 배경\n- 선수/코치 캐릭터\n- 경쟁과 협력 요소\n- 기록 갱신/성장 서사',
    'nature': '## 스토리 테마: 자연\n- 자연환경/생태계 배경\n- 동물/식물 캐릭터\n- 자연 관찰과 탐구\n- 환경 보호 메시지'
  };
  if (!storyTheme || !themes[storyTheme]) return '';
  return themes[storyTheme] + '\n\n';
}

function buildDifficultyInstructions(difficulty?: string): string {
  const levels: Record<string, string> = {
    'basic': `## 난이도: 기초
- 핵심 개념 1개에만 집중, 단순한 인터랙션
- 충분한 힌트와 시각적 가이드 제공 (힌트 버튼 3단계)
- 퀴즈 2문제 (직접 적용, 객관식 위주)
- 큰 버튼, 명확한 피드백, 실패해도 격려 메시지
- 텍스트 최소화, 시각적 설명 위주`,
    'intermediate': `## 난이도: 중급
- 개념 간 연결 포함, 다양한 인터랙션 유형
- 힌트 3단계 제공 (관찰 → 규칙 → 풀이)
- 퀴즈 3문제 (적용 2개 + 변형 1개)
- 드래그앤드롭, 슬라이더 등 조작형 인터랙션
- 정답/오답에 따른 분기 피드백`,
    'advanced': `## 난이도: 심화
- 복합 개념 통합, 다단계 문제 해결
- 최소 힌트 (1단계만), 스스로 발견 유도
- 퀴즈 4문제 (적용 2개 + 변형 1개 + 역추론 1개)
- 복잡한 조작과 연쇄 인터랙션
- 오답 시 구체적 설명과 재도전 기회`,
    'challenge': `## 난이도: 도전
- 학년 이상의 확장 문제, 창의적 문제 해결 요구
- 힌트 없음, 자유 탐구 모드
- 퀴즈 5문제 (종합 3개 + 심화 2개, 서술형 포함)
- 시간 제한 옵션, 점수 보드
- 실패 시에도 학습 포인트 제시`
  };
  if (!difficulty || !levels[difficulty]) return '';
  return levels[difficulty] + '\n\n';
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
  const artAssetContext = await buildArtAssetContext(request);
  const contentTypeInstructions = buildContentTypeInstructions(request.contentType);
  const visualStyleInstructions = buildVisualStyleInstructions(request.visualStyle);
  const storyThemeInstructions = buildStoryThemeInstructions(request.storyTheme);
  const difficultyInstructions = buildDifficultyInstructions(request.difficulty);

  return `${systemPrompt}\n\n---\n\n${artAssetContext}${contentTypeInstructions}${visualStyleInstructions}${storyThemeInstructions}${difficultyInstructions}## 생성 요청\n- 과목: ${request.subject}\n- 주제: ${request.topic}\n- 학년: ${request.gradeLevel}\n- 콘텐츠 유형: ${request.contentType || '자동 선택'}\n- 비주얼 스타일: ${request.visualStyle || '자동 선택'}\n- 스토리 테마: ${request.storyTheme || '자동 선택'}\n- 난이도: ${request.difficulty || '중급'}\n- 아트 에셋 사용: ${request.useArtAssets === false ? '아니오' : '예'}\n\n위 주제에 대한 7씬 교육 콘텐츠를 생성하고 edu-content/${moduleId}/ 폴더에 저장하세요.\n필수 파일: index.html, script.js, style.css\n`;
}
