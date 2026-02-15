# 테스팅 패턴

**분석 날짜:** 2026-02-15

## 테스트 프레임워크

### 실행기 (Runner)

**Node.js 내장 test 모듈:**
- 프레임워크: `node:test`
- 버전: Node.js 18.0+
- 설정 파일: 없음 (내장)

**실행 명령어:**
```bash
npm test              # node --test
```

**구성:**
```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

### Assertion 라이브러리

**Node.js 내장 assert/strict:**
```javascript
const assert = require('node:assert/strict');

assert.equal(actual, expected);        // 동등성 검사
assert.ok(value);                      // 참/거짓
assert.throws(() => fn(), /error/);    // 예외 발생 확인
assert.match(string, regex);           // 정규식 매칭
```

**특징:**
- strict mode 사용 (`node:assert/strict`)
- 타입 엄격 검사: `1 === '1'` 실패

## 테스트 파일 구조

### 위치

**API 테스트:**
- `tests/api-*.test.js` 형식
- 예:
  - `tests/api-validation.test.js`: 요청 검증
  - `tests/api-job-manager.test.js`: Job 관리
  - `tests/api-zai-output.test.js`: 출력 파싱
  - `tests/api-review-api.test.js`: 리뷰 로직

**이미지/에셋 테스트:**
- `tests/assets-3d-file-integrity.test.js`

**통합 테스트:**
- `tests/admin-integration.test.js`

**CLI/스크립트 테스트:**
- `tests/backfill-jobs.test.js`
- `tests/run-tests.js`: 수동 검증 (assert 기반)

### 명명 규칙

**파일명:**
- `{target-area}.test.js`
- 예: `api-validation.test.js`, `api-job-manager.test.js`

**테스트 함수:**
- `test('설명', () => { ... })`

## 테스트 구조

### 기본 패턴

**import + describe 없음** (Node.js test 모듈 사용):

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const { validateGenerateContentRequest } = require('../api/dist');

test('validateGenerateContentRequest allows valid request', () => {
  const result = validateGenerateContentRequest({
    subject: 'math',
    topic: '피타고라스 정리',
    gradeLevel: '중학교 3학년'
  });

  assert.equal(result.ok, true);
});
```

**테스트 그룹화:**
- 파일당 여러 `test()` 호출
- 각 테스트 독립적

### 실제 예시

#### 검증 테스트 (`api-validation.test.js`)

```javascript
test('validateGenerateContentRequest rejects invalid subject', () => {
  const result = validateGenerateContentRequest({
    subject: 'cooking',        // 유효하지 않음
    topic: '테스트',
    gradeLevel: '중학교 1학년'
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_SUBJECT');
});
```

#### Job 관리 테스트 (`api-job-manager.test.js`)

```javascript
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-content-api-'));
process.env.JOB_STORE_PATH = path.join(tempDir, 'jobs.json');
process.env.JOB_TTL_MS = String(60 * 60 * 1000);

const { initializeJobStore, createJob, getJob, updateJob } = require('../api/dist/job-manager');

test('job-manager creates and persists jobs', () => {
  initializeJobStore();

  const request = {
    subject: 'math',
    topic: '테스트 주제',
    gradeLevel: '중학교 3학년'
  };

  const jobId = createJob(request);
  const job = getJob(jobId);

  assert.ok(job);
  assert.equal(job.status, 'pending');

  updateJob(jobId, { status: 'completed', moduleId: '20260126-test' });

  const stored = JSON.parse(fs.readFileSync(process.env.JOB_STORE_PATH, 'utf8'));
  const storedJob = stored.jobs.find((item) => item.id === jobId);

  assert.ok(storedJob);
  assert.equal(storedJob.status, 'completed');
});
```

**설정 패턴:**
- 임시 디렉토리 생성: `fs.mkdtempSync()`
- 환경 변수 주입: `process.env.JOB_STORE_PATH = ...`
- 초기화 호출: `initializeJobStore()`
- 모듈 임포트: 테스트 파일 최상단

#### 파싱 테스트 (`api-zai-output.test.js`)

```javascript
test('parseZaiOutput accepts markdown file blocks', () => {
  const moduleId = '20260126-sample';
  const payload = [
    '요청한 파일을 생성했습니다.',
    '',
    `### edu-content/${moduleId}/index.html`,
    '```html',
    '<!doctype html>...',
    '```',
    // ... 추가 파일 블록
  ].join('\n');

  const files = parseZaiOutput(payload, moduleId);

  assert.equal(files.length, 3);
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  assert.match(byPath.get(`edu-content/${moduleId}/index.html`), /<!doctype html>/i);
});
```

**다양한 입력 형식 검증:**
- JSON 페이로드
- JSON 펜스 (`\`\`\`json`)
- 마크다운 파일 블록 (전체 경로)
- 마크다운 파일 블록 (파일명만)

#### 수동 검증 (`run-tests.js`)

```javascript
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const targets = [
  '20260126-present-perfect-vs-past',
  '20260126-passive-voice'
];

const requiredFiles = ['index.html', 'style.css', 'script.js'];
const requiredScenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];

targets.forEach((slug) => {
  const dir = path.join(root, 'edu-content', slug);

  requiredFiles.forEach((file) => {
    assertFileExists(path.join(dir, file));
  });

  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assertContains(html, /<html\s+lang=["']ko["']>/i, `${slug}: html lang=ko`);
  assertContains(html, /href=["']..\/common\.css["']/, `${slug}: common.css link`);

  requiredScenes.forEach((scene) => {
    const regex = new RegExp(`id=["']${scene}-scene["']`);
    assertContains(html, regex, `${slug}: ${scene}-scene section`);
  });
});

console.log('All tests passed.');
```

**특징:**
- 파일 시스템 검증 (존재 여부)
- HTML 구조 검증 (정규식)
- 스크린 검증 (7씬 구조)

## Mocking

### 환경 변수 Mocking

**Job 저장소 테스트:**
```javascript
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-content-api-'));
process.env.JOB_STORE_PATH = path.join(tempDir, 'jobs.json');
process.env.JOB_TTL_MS = String(60 * 60 * 1000);
```

**패턴:**
- 임시 디렉토리로 격리
- 환경 변수로 경로 오버라이드
- 각 테스트 독립성 보장

### API 응답 Mocking

**JSON 고정 응답:**
```javascript
const payload = JSON.stringify({
  files: [
    {
      path: `edu-content/${moduleId}/index.html`,
      content: '<!doctype html>'
    },
    {
      path: `edu-content/${moduleId}/script.js`,
      content: 'console.log("ok");'
    }
  ]
});

const files = parseZaiOutput(payload, moduleId);
```

**마크다운 블록 고정 응답:**
```javascript
const payload = [
  '### index.html',
  '```html',
  '<!doctype html>...',
  '```',
  '### script.js',
  '```js',
  'console.log("ok");',
  '```'
].join('\n');

const files = parseZaiOutput(payload, moduleId);
```

## 무엇을 Mock하는가

### Mock 대상

1. **파일 시스템:**
   - 임시 디렉토리로 격리
   - 실제 파일 읽기/쓰기 테스트

2. **환경 변수:**
   - `process.env.JOB_STORE_PATH`
   - `process.env.JOB_TTL_MS`

3. **외부 API:**
   - 실행 환경 검사: `ASYNC_JOBS_ENABLED` 활성화 여부
   - 테스트에서 비활성화: 외부 호출 방지

### Mock 미대상

1. **비즈니스 로직:**
   - 검증, Job 생성, 상태 추적
   - 직접 테스트

2. **문자열 파싱:**
   - JSON 파싱
   - 마크다운 블록 추출
   - 경로 검증

## 커버리지

### 요구사항

**설정:** 명시적 커버리지 요구 없음

### 테스트 영역

**API 검증 (`api-validation.test.js`):**
```
✓ 유효한 요청 수락
✓ 유효하지 않은 주제 거부
✓ science 주제 지원
✓ useArtAssets boolean 검증
✓ contentType/visualStyle/storyTheme/difficulty 검증
```

**Job 관리 (`api-job-manager.test.js`):**
```
✓ Job 생성 및 영속성
✓ Job 상태 추적 (pending → completed)
✓ 만료된 Job 정리 (TTL)
```

**출력 파싱 (`api-zai-output.test.js`):**
```
✓ JSON 페이로드 파싱
✓ JSON 펜스 파싱
✓ 마크다운 파일 블록 파싱 (전체 경로)
✓ 마크다운 파일 블록 파싱 (파일명만)
✓ 경로 이스케이프 차단 (../secrets.txt)
```

**보안 검증:**
```
✓ 경로 이스케이프 방지
✓ 허용 확장자만 수락
✓ edu-content 디렉토리 범위 제한
```

**교육 콘텐츠 구조 (`run-tests.js`):**
```
✓ 필수 파일 존재 (index.html, script.js, style.css)
✓ 한국어 lang 속성 (lang="ko")
✓ 7씬 구조 (hook, anchor, story, core, visualize, quiz, wrap)
✓ 공통 CSS 링크
✓ 상대 경로 검증
```

## 테스트 타입

### 단위 테스트 (Unit Tests)

**대상:**
- 함수 검증: `validateGenerateContentRequest()`
- 상태 관리: `createJob()`, `updateJob()`
- 파싱: `parseZaiOutput()`
- 보안: 경로 검증, 확장자 필터링

**범위:**
- 한 개 함수 단위
- 입력 → 출력 검증
- 예외 처리 확인

**예시:**
```javascript
test('validateGenerateContentRequest rejects invalid subject', () => {
  const result = validateGenerateContentRequest({
    subject: 'cooking',        // 입력
    topic: '테스트',
    gradeLevel: '중학교 1학년'
  });

  assert.equal(result.ok, false);         // 검증
  assert.equal(result.code, 'INVALID_SUBJECT');
});
```

### 통합 테스트 (Integration Tests)

**대상:**
- Job 저장소: 생성 → 영속 → 복구
- 만료 정책: TTL 기반 정리
- 파일 구조: 모듈 검증

**범위:**
- 여러 함수/모듈 협력
- 파일 시스템 상호작용
- 상태 변화 검증

**예시:**
```javascript
test('job-manager creates and persists jobs', () => {
  const jobId = createJob(request);      // 생성
  updateJob(jobId, { status: 'completed' });  // 업데이트

  const stored = JSON.parse(fs.readFileSync(...));  // 파일 확인
  const storedJob = stored.jobs.find((item) => item.id === jobId);

  assert.ok(storedJob);                  // 검증
  assert.equal(storedJob.status, 'completed');
});
```

### 구조 검증 (Structure Tests)

**대상:**
- 교육 콘텐츠 모듈
- 필수 파일 존재
- HTML 구조 (씬 배열)

**범위:**
- 파일 시스템 검증
- HTML 정규식 검증
- 선언적 구조 확인

**예시:**
```javascript
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
assertContains(html, /<html\s+lang=["']ko["']>/i, `lang=ko`);
requiredScenes.forEach((scene) => {
  const regex = new RegExp(`id=["']${scene}-scene["']`);
  assertContains(html, regex, `${scene}-scene section`);
});
```

### E2E 테스트

**상태:** 없음 (구현 안 됨)

**가능성:**
- 콘텐츠 생성 엔드포인트 (Z.ai API 필요)
- 리뷰 엔드포인트 (LLM 필요)
- 파일 쓰기 검증

## 테스트 실행

### 명령어

```bash
# 모든 테스트 실행
npm test

# 실제로는:
node --test

# Node.js 자동 검색:
# - tests/**/*.test.js
# - **/*.test.js
# - **/*.spec.js
```

### 테스트 발견

**Node.js test 모듈 자동 검색:**
- 패턴: `**/{.,}*.test.{cjs,mjs,js}`
- `tests/` 디렉토리 포함

**프로젝트 구조:**
```
tests/
├── api-validation.test.js
├── api-job-manager.test.js
├── api-zai-output.test.js
├── api-review-api.test.js
├── assets-3d-file-integrity.test.js
├── admin-integration.test.js
└── run-tests.js  # 수동 검증 (assert 기반)
```

## 주요 테스트 케이스

### 요청 검증 (`api-validation.test.js`)

| 테스트 | 입력 | 예상 |
|--------|------|------|
| Valid request | `{ subject: 'math', topic: '...', gradeLevel: '...' }` | `ok: true` |
| Invalid subject | `{ subject: 'cooking', ... }` | `code: INVALID_SUBJECT` |
| Empty topic | `{ topic: '', ... }` | `code: INVALID_REQUEST` |
| Long topic | `{ topic: 'x'.repeat(201), ... }` | `code: INVALID_REQUEST` |
| Invalid useArtAssets | `{ useArtAssets: 'yes', ... }` | `code: INVALID_REQUEST` |

### Job 생명주기 (`api-job-manager.test.js`)

| 단계 | 작업 | 검증 |
|------|------|------|
| 생성 | `createJob(request)` | `status: pending` |
| 업데이트 | `updateJob(jobId, { status: 'completed' })` | 파일 영속성 |
| 조회 | `getJob(jobId)` | 상태 반환 |
| 만료 | `cleanupExpiredJobs()` | TTL 초과 항목 제거 |

### 출력 파싱 (`api-zai-output.test.js`)

| 형식 | 입력 | 검증 |
|------|------|------|
| JSON | `{ files: [...] }` | 파일 배열 |
| JSON 펜스 | `` ```json ... ``` `` | 파일 배열 |
| 마크다운 (경로) | `### edu-content/.../index.html` ``` | 경로 복원 |
| 마크다운 (파일명) | `### index.html` ``` | 경로 생성 |
| 경로 공격 | `../secrets.txt` | 예외 발생 |

---

*테스팅 분석: 2026-02-15*
