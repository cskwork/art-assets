# 코딩 컨벤션

**분석 날짜:** 2026-02-15

## 명명 규칙

### 파일명

**TypeScript/JavaScript (API):**
- camelCase 사용
- `index.ts`, `logger.ts`, `zai-client.ts` 형태
- 모듈 이름 + 기능 (예: `zai-output.ts`, `job-manager.ts`)
- 테스트 파일: `{target}.test.js` 형식

**Node.js 스크립트:**
- kebab-case 사용
- `build-gallery.js`, `build-assets.js`, `archive.js`

**교육 콘텐츠 모듈:**
- 날짜 접두어 + kebab-case 주제명
- 예: `20260126-box-volume/`, `20260127-action-verbs-phaser/`
- 구성: `index.html`, `script.js`, `style.css` 포함

**에셋 파일:**
- 형식: `{category}-{description}-{variant}-{YYYYMMDD}.{ext}`
- 예: `icon-checkmark-green-20260124.svg`
- 카테고리 약어: `icon`, `illust`, `bg`, `diagram`, `photo`, `3d`

### 함수/메서드명

**TypeScript/API:**
- camelCase 사용
- 동사로 시작: `createJob()`, `updateJob()`, `validateGenerateContentRequest()`
- 불린 반환: `isAllowedWritePath()`, `needsThinking()`, `moduleExists()`
- 로거: `enableLogging()`, `getLogger()`, `logProgress()`

**JavaScript 모듈 (교육용):**
- camelCase 사용
- ContentApp 싱글톤 패턴 내 메서드:
  - `init()`: 초기화
  - `nextScene()`: 다음 화면 이동
  - `changeScene()`: 특정 화면 전환
  - `initHookScene()`, `initAnchorScene()` 등: 씬별 초기화
  - `updateProgress()`: 진행률 갱신
  - `checkAnswer()`: 퀴즈 정답 확인

### 변수명

**TypeScript (API):**
- camelCase 사용
- 타입 정보 명시적:
  - `const jobId: string`
  - `let isLoaded: boolean`
- 상수: UPPER_SNAKE_CASE
  - `const DEFAULT_JOB_TTL_MS = 7 * 24 * 60 * 60 * 1000;`
  - `const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js'])`

**JavaScript 모듈:**
- camelCase 사용
- ContentApp 객체 속성:
  - `currentScene`, `scenes`, `totalCubes`
  - `boxWidth`, `boxHeight`, `boxDepth` (도메인 관련)

### 타입명

**TypeScript:**
- PascalCase 사용
- export 인터페이스: `GenerateContentRequest`, `ReviewResult`, `Job`
- 타입 별칭: `JobStatus = 'pending' | 'processing' | 'completed' | 'failed'`
- 로그 태그 타입: `LogTag = 'INIT' | 'GEN' | 'REVIEW' | 'ERROR'` (UPPER_SNAKE_CASE)

## 코드 스타일

### 포맷팅

**언어:**
- TypeScript: ES2020 대상, CommonJS 모듈
- JavaScript (Node.js): ES2020 수준 사용 가능
- JavaScript (교육용): ES6+ 사용 가능, 프레임워크 불필요

**들여쓰기:**
- 2칸 스페이스 (명시적 설정 없음, 관례상)
- 일관성 있게 적용

**세미콜론:**
- 항상 사용
- TypeScript/API: 필수
- JavaScript 모듈: 필수

**줄 길이:**
- 제한 없음 (명시적 설정 없음)
- 읽기 편한 길이로 작성

### Linting

**설정:**
- ESLint 설정 없음 (검출 안 됨)
- Prettier 설정 없음

**관례:**
- TypeScript strict mode 활성화:
  - `tsconfig.json`에서 `"strict": true`
  - 타입 명시 필수, null 체크 필수
- `skipLibCheck: true`로 외부 라이브러리 타입 검사 생략

### 주석

**한국어 사용:**
- 설명, 섹션 구분, 주의사항 모두 한국어
- 예: `// 테스트에서 외부 API 호출을 막기 위해 비동기 실행을 끌 수 있다.`

**JSDoc 스타일 (선택적):**
```typescript
/**
 * 작업 저장소 초기화
 */
export function initializeJobStore() {
```

**인라인 주석:**
- 복잡한 로직 설명
- 예: `// 0 이하 값은 만료 비활성화로 처리한다.`

## 임포트 구조

**TypeScript (API):**

1. **Node.js 내장 모듈:** `import fs from 'node:fs/promises'`
2. **외부 라이브러리:** `import dotenv from 'dotenv'`
3. **로컬 모듈:** `import { createJob } from './job-manager'`
4. **타입 임포트:** `import { GenerateContentRequest } from './types'`

**순서 예시 (`index.ts`):**
```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createJob, updateJob } from './job-manager';
import { GenerateContentRequest } from './types';
```

**JavaScript (Node.js 스크립트):**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { archiveAsset } = require('./scripts/archive');
```

**JavaScript (교육용 모듈):**
- 대부분 글로벌 변수 또는 CDN 임포트
- 예: `window.THREE`, `window.MathJax`, `window.Phaser`

## 에러 처리

### 타입 안전성

**TypeScript (API):**

```typescript
// 검증 결과 반환 패턴
function validateGenerateContentRequest(input: unknown) {
  if (!input || typeof input !== 'object') {
    return { ok: false, code: 'INVALID_REQUEST' as const };
  }

  const record = input as Record<string, unknown>;
  // ... 검증 로직
  return { ok: true as const };
}
```

**에러 응답 패턴:**
```typescript
function buildErrorResponse(code: ErrorCode, message: string): ErrorResponse {
  return { success: false, error: message, code };
}
```

### 비동기 작업

**스트림 기반 에러 처리:**
```typescript
// zai-client.ts에서 HTTP 스트림 처리
req.on('data', chunk => { ... });
req.on('end', () => { ... });
req.on('error', reject);
```

**Job 상태 추적:**
- 상태: `pending` → `processing` → `completed`/`failed`
- 에러 메시지: `job.error`에 저장
- 회고 에러: `job.reviewError`에 분리 저장

### JavaScript 모듈 (교육용)

**글로벌 에러 처리:**
- 시도-실패 패턴: 불가능한 작업은 조용히 실패
- 예: `if (!textEl) return;` (요소 없으면 패스)

**콘솔 로깅:**
```javascript
try {
  execSync('node build-gallery.js', { stdio: 'inherit' });
  console.log('[빌드] 완료');
} catch (error) {
  console.error('[빌드] 실패:', error.message);
  return { success: false, error: error.message };
}
```

## 로깅

**커스텀 로거 (`logger.ts`):**

```typescript
export type LogTag =
  | 'INIT' | 'GEN' | 'REVIEW' | 'FIX' | 'API'
  | 'ISSUE' | 'SAVE' | 'WRITE' | 'DONE' | 'ERROR' | 'SIZE';

log(tag: LogTag, message: string)
logSize(label: string, text: string)
logProgress(tag: LogTag, elapsed: number, chars: number)
```

**사용 예:**
```typescript
log('GEN', 'Starting content generation for topic: ' + topic);
logSize('Response', content);
logProgress('GEN', elapsed, contentLength);
```

**출력 형식:**
```
[14:32:45] [GEN] Starting content generation...
[14:32:46] [SIZE] Response: 12,345자 (~3,086 토큰)
[GEN] 5초 경과, 12,345자 수신...
```

**기본값:**
- 로깅 비활성화 (no-op logger)
- `enableLogging(true)` 호출 시 활성화

## 모듈 구조

### TypeScript API (`api/src/`)

**계층 구조:**

1. **타입 정의** (`types.ts`):
   - 요청/응답 인터페이스
   - 상태 타입 (JobStatus, ReviewStatus)

2. **저장소** (`job-manager.ts`):
   - 인메모리 Map + 파일 기반 영속성
   - 만료 정책 (TTL)

3. **코어 로직** (`index.ts`, `content-generator.ts`):
   - 요청 검증
   - Job 생성 및 상태 추적
   - 콘텐츠 생성/리뷰 오케스트레이션

4. **LLM 통합** (`llm/`):
   - `zai-client.ts`: Z.ai API 스트리밍
   - `zai-output.ts`: JSON/마크다운 파싱
   - `review.ts`: 리뷰 프롬프트 및 평가

5. **헬퍼** (`logger.ts`, `prompt-loader.ts`):
   - 로깅, 프롬프트 로딩

### JavaScript 모듈 (교육용)

**7씬 표준 구조:**

1. **Hook**: 흥미 제시 + 문제 소개
2. **Anchor**: 선행학습 개념
3. **Story**: 캐릭터 스토리 (타자 효과)
4. **Core**: 인터랙티브 활동 (드래그, 슬라이더, 입력)
5. **Visualize**: 공식 도출 및 설명
6. **Quiz**: 객관식 문제 (보통 3-5개)
7. **Wrap**: 학습 요약 및 보상

**패턴:**
```javascript
const ContentApp = {
  currentScene: 0,
  scenes: ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'],

  init() { ... },
  nextScene() { ... },
  changeScene(index) { ... },
  updateProgress() { ... }
};

document.addEventListener('DOMContentLoaded', () => ContentApp.init());
```

## 환경 설정

**프로젝트 루트 감지:**
```typescript
function getProjectRoot() {
  return process.env.PROJECT_ROOT || process.cwd();
}
```

**환경 변수 (`.env`):**
- `ZAI_API_KEY`: Z.ai API 키
- `ZAI_API_URL`: Z.ai API 엔드포인트 (기본: `https://api.z.ai/api/paas/v4/chat/completions`)
- `ZAI_MODEL`: LLM 모델 (기본: `glm-4.7`)
- `PROJECT_ROOT`: 프로젝트 루트 경로
- `JOB_STORE_PATH`: Job 저장소 경로 (기본: `api/data/jobs.json`)
- `JOB_TTL_MS`: Job 만료 시간 (기본: 7일)
- `ASYNC_JOBS_ENABLED`: 비동기 작업 활성화 (기본: `true`)

## 파일 접근 보안

**경로 유효성 검사 패턴:**

```typescript
function isAllowedWritePath(filePath: string, rootDir: string) {
  const resolvedPath = path.resolve(rootDir, filePath);
  const eduContentRoot = path.resolve(rootDir, 'edu-content');

  // edu-content 디렉토리 내만 허용
  if (!resolvedPath.startsWith(`${eduContentRoot}${path.sep}`)) {
    return false;
  }

  // 허용 확장자만 사용
  const extension = path.extname(resolvedPath).toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension);
}
```

**허용 확장자:**
- `.html`, `.css`, `.js`, `.svg`, `.png`, `.jpg`

**Node.js 서버 (`server.js`):**
```javascript
function serveStatic(req, res, filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);

  // ROOT_DIR 외부 접근 방지
  if (!fullPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
```

---

*컨벤션 분석: 2026-02-15*
