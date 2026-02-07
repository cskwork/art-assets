# Phase 01: Foundation + Admin Server + Working Prototype

이 Phase에서는 Express 기반 Admin 서버를 구축하고, 기존 API 모듈과 통합하여 Admin UI에서 콘텐츠 생성 요청을 보내고 실시간 상태를 확인할 수 있는 작동하는 프로토타입을 완성한다. Phase 완료 후 `npm run dev`로 서버를 시작하면 브라우저에서 Admin 대시보드가 표시되고, 콘텐츠 유형/과목/수량 선택 후 생성 요청을 보낼 수 있어야 한다.

## Tasks

- [x] 기존 프로젝트 구조 분석 및 의존성 설치:
  - `api/src/` 디렉토리의 TypeScript 소스 전체를 읽어서 현재 content-generator.ts, job-manager.ts, types.ts, review.ts 구조를 파악한다
  - `prompts/` 폴더의 모든 프롬프트 파일(math.md, english.md, science.md, 3d-content.md)을 읽는다
  - `server.js` 현재 구현을 읽는다
  - `api/package.json`과 루트 `package.json`의 현재 의존성을 확인한다
  - 루트 프로젝트에 Express, cors, express-ws(WebSocket 지원), concurrently 설치: `npm install express cors express-ws` + `npm install -D concurrently`
  - `api/` 디렉토리에서 TypeScript 빌드 확인: `cd api && npm run build`
  > **완료 (2026-02-07)**: 프로젝트 구조 분석 완료. api/src/ 내 11개 TS 파일 (types.ts, index.ts, job-manager.ts, content-generator.ts, prompt-loader.ts, logger.ts, llm/provider.ts, llm/zai-client.ts, llm/zai-output.ts, llm/review.ts, llm/json-utils.ts) 파악. prompts/ 내 6개 파일 확인. 루트에 express@4, cors, express-ws, concurrently 설치. api/에 express@4, cors, express-ws + @types 설치. Node.js 16 호환을 위해 Express 4 사용. TypeScript 빌드 성공.

- [x] Express 기반 Admin 서버 생성 (`admin-server.ts`):
  - `api/src/admin-server.ts` 파일 생성 (기존 server.js를 대체하지 않고 별도로 구축)
  - Express 앱 설정: CORS 활성화, JSON body parser, 정적 파일 서빙
  - 기존 `server.js`의 API 엔드포인트를 Express 라우터로 이관:
    - `POST /api/generate-content` -> 기존 `createGenerateContentJob` 호출
    - `GET /api/generate-content/status/:jobId` -> 기존 `getGenerateContentStatus` 호출
    - `POST /api/review-content` -> 기존 `createReviewContentJob` 호출
    - `GET /api/review-content/status/:jobId` -> 기존 `getReviewContentStatus` 호출
    - `POST /api/archive/:assetId` -> 기존 archive 로직
    - `POST /api/restore/:assetId` -> 기존 restore 로직
  - 새 Admin API 엔드포인트 추가:
    - `GET /api/admin/config` -> 사용 가능한 과목, 콘텐츠 유형, 아트 에셋 카테고리 목록 반환
    - `GET /api/admin/jobs` -> 전체 Job 목록 반환 (진행 중 + 완료 + 실패)
    - `POST /api/admin/batch-generate` -> 다중 콘텐츠 생성 요청 (수량 지정, 각각 별도 Job으로 생성)
    - `GET /api/admin/assets` -> assets-index.json 기반 에셋 목록 반환
    - `GET /api/admin/prompts` -> 사용 가능한 프롬프트 목록 반환
  - WebSocket 엔드포인트: `ws://localhost:3000/ws` -> Job 상태 변경 시 실시간 브로드캐스트
  - 정적 파일 서빙: `/admin` -> `admin-ui/` 폴더, `/` -> 기존 gallery.html, `/edu-content` -> edu-content/ 폴더
  - 포트: 3000 (기존과 동일, `PORT` 환경변수 지원)
  > **완료 (2026-02-07)**: `api/src/admin-server.ts` 생성. Express + express-ws 기반. 기존 server.js 6개 엔드포인트 + 신규 Admin 5개 엔드포인트 + WebSocket 브로드캐스트 구현. job-manager.ts에 `getAllJobs()` 함수 추가. admin-ui/ placeholder 생성. TypeScript 빌드 성공. 서버 기동 테스트 및 API 응답 확인 완료.

- [x] `api/src/types.ts` 확장 및 타입 정의:
  - 기존 `api/src/types.ts`를 읽고 현재 타입을 확인한다
  - `Subject` 타입에 'science' 추가: `'math' | 'english' | 'science'`
  - `ContentType` 타입 추가: `'phaser' | 'threejs'`
  - `BatchGenerateRequest` 인터페이스 추가: `{ subject, contentType, gradeLevel, count, useArtAssets?, topics? }`
  - `BatchGenerateResponse` 인터페이스 추가: `{ batchId, jobs: { jobId, topic, status }[] }`
  - `AdminConfig` 인터페이스 추가: `{ subjects, contentTypes, gradeLevels, artAssetCategories }`
  - `JobSummary` 인터페이스 추가: Job 목록 조회용 경량 타입
  > **완료 (2026-02-07)**: `types.ts`에 6개 타입 추가/확장. Subject에 'science' 추가, ContentType 신규 타입, BatchGenerateRequest/Response, AdminConfig, JobSummary 인터페이스 정의. `admin-server.ts`에서 새 타입 import 및 /api/admin/config, /api/admin/jobs, /api/admin/batch-generate 엔드포인트에 타입 적용. TypeScript 빌드 성공.

- [x] Admin UI 프론트엔드 생성 (`admin-ui/`):
  - `admin-ui/index.html` 생성: 단일 페이지 Admin 대시보드
    - 헤더: "AI 교육 콘텐츠 생성기" 타이틀, 로고
    - 좌측 사이드바: 생성 설정 패널
      - 과목 선택 드롭다운: 수학, 영어, 과학
      - 콘텐츠 유형 선택: Phaser 2D 게임, Three.js 3D 시각화
      - 학년 선택: 초등3-4, 초등5-6, 중1, 중2, 중3
      - 생성 수량 입력: 1-10 (숫자 입력 + 슬라이더)
      - 아트 에셋 사용 체크박스
      - "생성 시작" 버튼
    - 메인 영역: Job 상태 대시보드
      - 카드 레이아웃으로 각 Job 표시 (상태 아이콘, 진행률, 과목/유형 태그)
      - 상태별 색상: pending(회색), processing(파란색 펄스), completed(초록), failed(빨강)
      - 각 카드에 "미리보기" 버튼 (완료된 콘텐츠를 iframe으로 미리보기)
    - 하단: 실시간 로그 패널 (WebSocket으로 수신)
  - `admin-ui/styles.css` 생성:
    - 다크 모드 기본 테마 (관리자 도구 느낌)
    - Noto Sans KR 폰트
    - 반응형 그리드 레이아웃 (CSS Grid)
    - 카드 컴포넌트, 펄스 애니메이션, 상태 배지
    - 모달 오버레이 (콘텐츠 미리보기용)
  - `admin-ui/app.js` 생성:
    - 앱 초기화: `/api/admin/config`에서 설정 로드
    - WebSocket 연결 및 재연결 로직
    - 생성 요청 함수: 폼 데이터 -> `/api/admin/batch-generate` POST
    - Job 상태 폴링: 5초 간격 `/api/admin/jobs` GET
    - WebSocket 메시지 수신 시 UI 실시간 업데이트
    - 콘텐츠 미리보기 모달: iframe으로 `/edu-content/{moduleId}/index.html` 로드
    - 로그 패널 업데이트 함수
  > **완료 (2026-02-07)**: Admin UI 3개 파일 생성 완료. `index.html`: CSS Grid 기반 3영역 레이아웃 (헤더+사이드바+메인+로그), 미리보기 모달. `styles.css`: 다크 모드 테마 (#0f0f1a/#1a1a2e), Noto Sans KR, 상태별 색상 배지, 처리 중 펄스 애니메이션, 반응형 768px 브레이크포인트. `app.js`: /api/admin/config 로드 -> 드롭다운 바인딩, WebSocket 연결/재연결/메시지 처리, batch-generate POST, 5초 간격 Job 폴링, 상태별 카드 렌더링, iframe 미리보기 모달, 실시간 로그 패널. 서버 기동 후 /admin/ HTML 200, /admin/styles.css 200, /admin/app.js 200, /api/admin/config JSON 응답, /api/admin/jobs 응답 모두 정상 확인.

- [x] batch-generate 로직 구현 (`api/src/batch-manager.ts`):
  - 기존 `content-generator.ts`의 `generateContent()` 함수를 재사용한다
  - `BatchManager` 클래스 생성:
    - `startBatch(request: BatchGenerateRequest)`: 요청된 수량만큼 개별 Job 생성, 순차 또는 병렬 실행
    - `getBatchStatus(batchId)`: 배치 내 모든 Job 상태 반환
    - 각 Job은 독립 context에서 실행 (기존 async Job 패턴 활용)
    - 토픽이 지정되지 않은 경우: 기본 토픽 목록에서 순차 선택
  - 기본 토픽 목록 (`api/src/default-topics.ts` 생성):
    - 수학: ["분수의 덧셈", "소수의 곱셈", "비와 비율", "원의 넓이", "직육면체 부피"]
    - 영어: ["현재시제", "비교급", "조동사 can", "전치사", "동사 분류"]
    - 과학: ["물의 상태 변화", "식물의 광합성", "전기 회로", "태양계", "소화 과정"]
  - 배치 상태 persistence: `api/data/batches.json`에 저장
  > **완료 (2026-02-07)**: `api/src/batch-manager.ts` BatchManager 클래스 생성 (startBatch, getBatchStatus, getAllBatches). `api/src/default-topics.ts` 과목별 기본 토픽 10개씩 정의. admin-server.ts의 batch-generate 엔드포인트를 BatchManager로 교체 + GET /api/admin/batch/:batchId 조회 엔드포인트 추가. batches.json 파일 persistence 구현. index.ts의 subject 검증에 'science' 추가. 기존 validation 테스트 업데이트 + batch-manager 테스트 7개 작성. 전체 테스트 통과, TypeScript 빌드 성공.

- [x] 서버 시작 스크립트 및 빌드 설정:
  - `api/tsconfig.json`에 `admin-server.ts` 포함 확인 (이미 src/**/*.ts 포함이면 자동)
  - 루트 `package.json`의 scripts 업데이트:
    - `"dev": "concurrently \"cd api && npm run build -- --watch\" \"node api/dist/admin-server.js\""`
    - `"build": "cd api && npm run build && node build-gallery.js"`
    - `"start": "node api/dist/admin-server.js"`
  - `api/package.json`의 scripts에 `"build": "tsc"` 확인
  - `.env.example` 업데이트: 새로운 환경변수 문서화 (ADMIN_PORT, WS_ENABLED 등)
  > **완료 (2026-02-07)**: tsconfig.json은 이미 `src/**/*.ts` 포함으로 admin-server.ts 자동 포함 확인. 루트 package.json에 dev/build/start 스크립트 추가: dev는 concurrently로 tsc --watch + admin-server 동시 실행, build는 api 빌드 + gallery 빌드 순차 실행, start는 admin-server 직접 실행. api/package.json에 build:watch 스크립트 추가. admin-server.ts에 ADMIN_PORT(PORT 대비 우선) 및 WS_ENABLED(WebSocket 비활성화 옵션) 환경변수 지원 추가. .env.example에 Admin 서버 설정(ADMIN_PORT, WS_ENABLED, PROJECT_ROOT, JOB_STORE_PATH, BATCH_STORE_PATH, ASYNC_JOBS_ENABLED) 문서화. TypeScript 빌드 성공, 전체 11개 테스트 통과.

- [ ] TypeScript 빌드 및 서버 기동 테스트:
  - `cd api && npm run build` 실행하여 컴파일 에러가 없는지 확인
  - 컴파일 에러 발생 시 수정 (타입 불일치, import 경로 등)
  - `node api/dist/admin-server.js` 실행하여 서버가 정상 시작되는지 확인
  - `curl http://localhost:3000/api/admin/config` 로 설정 API 응답 확인
  - `curl http://localhost:3000/admin/` 로 Admin UI HTML 로드 확인
  - 서버 종료 후 성공 메시지 출력

- [ ] Admin UI 통합 테스트 및 최종 검증:
  - 서버를 시작하고 Admin UI가 브라우저에서 정상 렌더링되는지 확인
  - `/api/admin/config` 응답이 UI 드롭다운에 정확히 바인딩되는지 확인
  - `/api/admin/jobs` 응답이 Job 카드 레이아웃으로 표시되는지 확인
  - 간단한 생성 요청 테스트: math, threejs, 초등5-6, 수량 1로 batch-generate POST
  - Job 생성 확인 및 상태 폴링이 UI에 반영되는지 확인
  - 빌드 에러가 있으면 수정하고 재빌드
  - `docs/changelog/changelog-2026-02-07.md` 파일에 변경 사항 기록 (한국어)
