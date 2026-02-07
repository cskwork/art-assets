# Changelog - 2026-02-07

## Phase 01: Express Admin 서버 구축 및 Admin UI 프로토타입

### 추가
- `api/src/admin-server.ts`: Express + express-ws 기반 Admin 서버 (기존 server.js 대체 X, 별도 구축)
  - 기존 6개 API 엔드포인트 이관 (generate-content, review-content, archive, restore)
  - Admin 5개 엔드포인트 신규 (config, jobs, batch-generate, assets, prompts)
  - WebSocket `/ws` 엔드포인트: Job 상태 변경 실시간 브로드캐스트
  - 정적 파일: `/admin` (Admin UI), `/edu-content`, 루트 (gallery)
- `api/src/batch-manager.ts`: BatchManager 클래스 (startBatch, getBatchStatus, getAllBatches)
  - 배치 생성 시 기본 토픽 또는 사용자 지정 토픽 순차 선택
  - `api/data/batches.json` 파일 기반 persistence
- `api/src/default-topics.ts`: 과목별 기본 토픽 10개씩 (수학/영어/과학)
- `api/src/types.ts` 확장: ContentType, BatchGenerateRequest/Response, AdminConfig, JobSummary 타입 추가
- `admin-ui/index.html`: CSS Grid 기반 3영역 Admin 대시보드 (헤더+사이드바+메인+로그)
- `admin-ui/styles.css`: 다크 모드 테마, 상태별 색상 배지, 펄스 애니메이션, 반응형 레이아웃
- `admin-ui/app.js`: config 로드/드롭다운 바인딩, WebSocket 연결, batch-generate POST, 5초 Job 폴링, 미리보기 모달
- `tests/admin-integration.test.js`: Admin 서버 통합 테스트 13개 (API 응답, 정적 파일, DOM 구조 검증)

### 수정
- `api/src/job-manager.ts`: `getAllJobs()` 함수 추가
- `api/src/index.ts`: subject 검증에 `science` 추가
- 루트 `package.json`: dev/build/start 스크립트 추가 (concurrently 기반)
- `.env.example`: ADMIN_PORT, WS_ENABLED, PROJECT_ROOT 등 Admin 서버 환경변수 문서화

### 검증
- TypeScript 빌드 성공 (`tsc -p tsconfig.json`)
- 기존 단위 테스트 11개 전체 통과
- Admin 통합 테스트 13개 전체 통과
  - API: config (3과목/2유형/5학년), jobs (빈 배열/생성 반영), batch-generate (생성/400 에러)
  - 정적 파일: HTML 200, CSS 200, JS 200
  - UI: 19개 필수 DOM ID 존재, styles.css/app.js 참조 확인
- 서버 기동 테스트: 포트 3000, curl로 전체 엔드포인트 응답 확인
- batch-generate 실제 요청: math/threejs/elementary-5-6/1 -> Job 생성 (processing 상태 확인)
