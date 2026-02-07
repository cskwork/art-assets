# Changelog - 2026-02-07

## UI/UX 디자인 개선: Gallery + Admin 페이지

### Gallery 메인 페이지 (`build-gallery.js` -> `gallery.html`)
- Noto Sans KR + JetBrains Mono 폰트 적용
- CSS Custom Properties 기반 디자인 시스템 도입 (surface, text, accent, shadow 토큰)
- 헤더: glassmorphism 효과 (backdrop-filter), 검색 아이콘 SVG 내장, 에셋 수 badge 분리
- 카드: 프리뷰 높이 160px 확대, hover 시 이미지 scale 효과, pill 형태 태그, 부드러운 shadow 전환
- 모달: backdrop-filter blur 추가, 부드러운 scale+translateY 애니메이션
- 반응형: 768px/480px 두 단계 브레이크포인트 추가

### Admin UI (`admin-ui/styles.css`, `admin-ui/index.html`)
- 색상 팔레트 리뉴얼: indigo(#6366f1) accent, 개선된 다크 톤
- JetBrains Mono 적용 (로그, Job ID)
- select 커스텀 화살표 SVG, focus-visible 키보드 접근성
- Job 카드: gradient 상단 바, hover glow 효과, processing pulse-glow 애니메이션
- empty state SVG 아이콘, 닫기 버튼 SVG+텍스트
- 통계 카드 hover 효과, tabular-nums 적용

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

## 실행 스크립트 개선

### 수정
- `start.sh`: 메인 서버(`server.js`)와 Admin 서버(`api/dist/admin-server.js`)를 동시에 실행하도록 변경
  - 기본 포트: 메인 `3000`, Admin `3001` (`PORT`, `ADMIN_PORT` 환경변수로 재정의 가능)
  - 포트 충돌 방지: `PORT`와 `ADMIN_PORT`가 같으면 Admin 포트를 자동으로 다음 포트로 조정
  - `api/dist/admin-server.js`가 없으면 자동으로 `npm run build --prefix api` 실행
  - `Ctrl+C` 종료 시 두 서버 프로세스를 함께 정리하도록 종료 처리 추가
