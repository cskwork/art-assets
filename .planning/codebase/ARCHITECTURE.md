# 아키텍처

**분석 날짜:** 2026-02-15

## 패턴 개요

**전체:** 모듈식 에셋 관리 + LLM 기반 콘텐츠 생성

**핵심 특성:**
- 에셋 소스(compact 형식) → 빌드 → 갤러리(gallery.html) 및 인덱스
- 교육용 인터랙티브 모듈 생성 (7씬 표준 구조)
- TypeScript API 서버로 비동기 콘텐츠 생성 및 리뷰
- 정적 파일 서빙 + REST API + WebSocket 통합

## 계층 구조

**에셋 관리 계층 (Asset Management):**
- 목적: 에셋 저장소 구성 및 검색 지원
- 위치: `assets-source.json` (소스), `assets.json` (빌드 산출물), `assets-index.json` (LLM 검색용)
- 포함: 카테고리별 에셋 메타데이터 (id, category, tags, description, format, dimensions)
- 의존: JavaScript 빌드 스크립트 (`scripts/build-assets.js`)
- 사용자: 갤러리 (`build-gallery.js`), API, LLM 검색

**갤러리 계층 (Gallery Layer):**
- 목적: 에셋 시각화 및 관리 UI
- 위치: `gallery.html` (빌드 산출물), `build-gallery.js` (생성 스크립트)
- 포함: HTML5 동적 UI, 카테고리 탐색, Archive/Restore 기능, 모달 상태 관리
- 의존: `assets.json`, `assets-source.json` (아카이브 데이터)
- 사용자: 웹 브라우저, `server.js`를 통한 접근

**교육 콘텐츠 계층 (Edu-Content Layer):**
- 목적: 7씬 표준 구조의 인터랙티브 학습 모듈
- 위치: `edu-content/{YYYYMMDD}-{topic}/` (각 모듈은 index.html, script.js, style.css 포함)
- 포함: ContentApp 싱글톤 패턴, 씬 네비게이션, 인터랙션 로직, 3D/게임 통합
- 의존: 아트 에셋 (상대 경로로 참조), Three.js/Phaser CDN
- 사용자: API 콘텐츠 생성기, 최종 학생

**API 계층 (Content Generation API):**
- 목적: LLM을 이용한 비동기 콘텐츠 생성 및 품질 검증
- 위치: `api/src/` (TypeScript), `api/dist/` (컴파일 후 JavaScript)
- 포함 모듈:
  - `admin-server.ts`: Express 서버, REST API, WebSocket
  - `index.ts`: 콘텐츠 생성/리뷰 엔드포인트
  - `content-generator.ts`: 모듈 생성 로직
  - `job-manager.ts`: 작업 상태 추적 (메모리 + JSON 영속성)
  - `batch-manager.ts`: 배치 처리
  - `llm/`: Z.ai GLM API 클라이언트
  - `types.ts`: 전체 타입 정의
- 의존: Express, dotenv, Z.ai API
- 사용자: Admin UI, 외부 시스템

**정적 파일 서빙 계층 (Static Serving):**
- 목적: gallery.html, edu-content 모듈, 에셋 파일 제공
- 위치: `server.js` (Node.js HTTP 서버)
- 포함: MIME 타입 매핑, 경로 탐색 공격 방지, Archive/Restore API
- 의존: 기본 Node.js (express 없이 순수 http 사용)
- 사용자: 브라우저, 갤러리 UI

## 데이터 흐름

**에셋 추가 및 빌드 플로우:**

1. 사용자가 파일을 생성 (예: `icon-checkmark-green-20260124.svg`)
2. 파일을 카테고리 폴더에 저장 (`icons/`, `diagrams/` 등)
3. `assets-source.json`의 `assets` 배열에 compact 형식으로 추가: `[id, category, tags[], description, format?, dimensions?]`
4. `node build-gallery.js` 실행
   - → `scripts/build-assets.js` 실행
   - → compact 형식을 full 형식으로 확장
   - → `assets.json`, `assets-index.json` 생성
   - → `gallery.html` 생성
5. `node server.js`로 갤러리 서빙

**교육 콘텐츠 생성 플로우:**

1. 클라이언트가 API에 생성 요청: `POST /api/generate-content`
   - 페이로드: `{ subject, topic, gradeLevel, contentType?, visualStyle?, ... }`
2. `createGenerateContentJob()` 검증 및 작업 생성
   - 작업 ID 즉시 반환
   - `setImmediate()` 또는 `async` 호출로 비동기 실행
3. `generateContentForJob()`이:
   - 모듈 ID 생성: `YYYYMMDD-topic-slug`
   - `edu-content/{moduleId}/` 디렉토리 생성
   - 프롬프트 로드 (`prompts/` 디렉토리)
   - Z.ai GLM API 호출로 HTML/CSS/JS 생성
   - 파일 쓰기
   - 작업 상태 업데이트: pending → processing → completed
4. 클라이언트가 `GET /api/generate-content/status/{jobId}`로 주기적으로 폴링
5. 선택적으로 `POST /api/review-content` 호출로 리뷰 시작
6. 리뷰 작업도 비동기: LLM이 모듈 분석 → 품질 점수 및 이슈 목록 반환

**아카이브 플로우:**

1. 갤러리 UI에서 Archive 버튼 클릭
2. `POST /api/archive/{assetId}` (server.js 핸들러)
3. `scripts/archive.js`의 `archiveAsset()` 호출
   - 원본 파일: `{category}/{id}.{format}` → 아카이브: `archive/{category}/{id}.{format}`
   - `assets-source.json`의 `archived` 배열에 추가 (archivedDate 포함)
4. 자동 빌드: `node build-gallery.js` 실행
5. 페이지 새로고침: 아카이브 탭 표시

**상태 관리:**

- **메모리:** 활성 작업 (pending, processing)
- **파일 (JSON):** 완료 및 아카이브된 작업 (`api/data/jobs.json`)
- **에셋 소스:** `assets-source.json` (assets 배열 + archived 배열)

## 핵심 추상화

**ContentApp 싱글톤 (edu-content 모듈):**
- 목적: 각 모듈의 씬 네비게이션 및 상태 관리
- 예시: `edu-content/20260126-box-volume/script.js`
- 패턴: 전역 `window.ContentApp` 객체
  - `currentScene: number` (현재 씬 인덱스)
  - `scenes: string[]` (씬 ID 배열)
  - `nextScene()`: 씬 전환 및 진행률 업데이트
  - `init()`: 초기화
  - `checkAnswer(answer)`: 퀴즈 검증
  - `saveProgress()`: 진행 상황 저장
- 호출: `onclick="ContentApp.nextScene()"`

**Job (작업 추상화):**
- 목적: 생성 및 리뷰 작업의 라이프사이클 관리
- 위치: `api/src/job-manager.ts`
- 상태: pending → processing → completed/failed
- 메타데이터: jobId, jobType (generate/review), moduleId, status, error, review (리뷰만)
- 영속성: 메모리 + JSON 파일 (`api/data/jobs.json`)
- TTL: 24시간 자동 삭제

**Asset (에셋 추상화):**
- 목적: 다양한 카테고리 에셋의 통일된 표현
- 구조 (compact): `[id, category, tags[], description, format?, dimensions?]`
- 구조 (full): `{ id, path, category, tags, description, format, addedDate, dimensions?, isArchived }`
- 카테고리: icons, illustrations, diagrams, backgrounds, photos, 3d
- 경로 자동 생성: `{category}/{id}.{format}`

**Review (리뷰 결과):**
- 목적: 생성된 모듈의 품질 검증
- 구조: `{ pass, score, requirements, issues, summary, deterministic }`
- 이슈 구조: `{ severity (high/medium/low), location, message, fix?, category (structure/content/visual/...) }`
- 점수: 0-100
- 자동 수정: `autoFix: true`로 요청 시 LLM이 이슈 해결

## 진입점

**CLI 진입점:**
- `build-gallery.js`: 에셋 빌드 후 갤러리 생성
- `api/dist/admin-server.ts`: API 서버 시작 (`npm run dev`)
- `server.js`: 갤러리 서빙 (`node server.js`)
- `scripts/archive.js`: 에셋 아카이브/복원

**API 진입점:**
- `POST /api/generate-content`: 콘텐츠 생성 요청
- `GET /api/generate-content/status/{jobId}`: 생성 상태 조회
- `POST /api/review-content`: 리뷰 작업 생성
- `GET /api/review-content/status/{jobId}`: 리뷰 상태 조회
- `GET /api/jobs`: 모든 작업 목록
- `GET /api/admin`: Admin UI HTML
- `/gallery`: 정적 갤러리 (server.js)

**Web 진입점:**
- `http://localhost:3000/` (server.js): 갤러리 홈
- `http://localhost:3000/edu-content/{moduleId}/`: 모듈 실행
- Admin UI (API 서버): `http://localhost:{PORT}/api/admin`

## 에러 처리

**전략:** 명시적 검증 + try-catch + 상태 저장

**패턴:**

1. **요청 검증:** `validateGenerateContentRequest()` → ErrorResponse 반환
2. **작업 실패:** catch → 작업 상태 업데이트 (status: 'failed', error: message)
3. **API 응답:** ErrorResponse 구조 통일 `{ success: false, error, code }`
4. **복구:** 작업 재시도 가능 (리뷰의 `maxAttempts` 파라미터)
5. **로깅:** `logger.ts` 모듈로 구조화된 로그

**주요 에러 코드:**
- `INVALID_SUBJECT`: 지원하지 않는 교과목
- `INVALID_REQUEST`: 필드 검증 실패
- `JOB_NOT_FOUND`: 작업 ID 없음
- `MODULE_NOT_FOUND`: edu-content 모듈 없음
- `INTERNAL_ERROR`: 서버 오류

## 횡단 관심사

**로깅:** `api/src/logger.ts`
- 구조화된 로그: `{ timestamp, level, message, context }`
- 사용처: 작업 추적, 에러 로깅

**검증:** 타입스크립트 + 런타임 검증
- 요청 검증 함수: `validateGenerateContentRequest()`, `validateReviewContentRequest()`
- 타입 안정성: `types.ts`에서 전체 인터페이스 정의

**인증:** .env 기반 (Z.ai API 키)
- 환경 변수: `Z_AI_API_KEY`, `PROJECT_ROOT`, `ASYNC_JOBS_ENABLED`
- 보안: .env 파일 .gitignore에 포함

**비동기 작업 관리:**
- `setImmediate()` 또는 `async` 패턴으로 비동기 실행
- 작업 상태 메모리에 저장, 주기적으로 JSON 파일에 동기화
- 24시간 TTL 자동 삭제 (`startJobCleanup()`)
- WebSocket으로 실시간 진행률 업데이트 가능 (admin-server.ts)

---

*아키텍처 분석: 2026-02-15*
