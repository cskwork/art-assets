# Changelog - 2026-02-07

## 3D Viewer WebGL Context Lost 대응 (`3d/viewer.html`, `tests/viewer-ux-refresh.test.js`)

### 문제
- `3d/viewer.html`에서 카드 수만큼 `WebGLRenderer`를 즉시 생성하면서 브라우저 컨텍스트 한도를 초과
- 콘솔에 `THREE.WebGLRenderer: Context Lost.`가 연속 출력되고 일부 카드 렌더링이 불안정해짐

### 수정
- 렌더러 관리 방식을 컨텍스트 풀 기반으로 변경
  - `MAX_ACTIVE_RENDERERS` 상수로 동시 활성 렌더러 수를 제한
  - `acquireRenderer` / `releaseRenderer`로 렌더러 재사용
  - `processVisibleQueue`로 화면에 보이는 카드만 우선 활성화
- 카드 생성 시 즉시 렌더러를 만들지 않고, `IntersectionObserver`로 화면 진입 시 활성화/이탈 시 비활성화
- 정리 중(`cleanupViewers`)에는 재활성화가 발생하지 않도록 보호 플래그 추가
- 오토회전 토글은 활성 컨트롤러에만 적용되도록 안정화

### 테스트 (TDD)
- `tests/viewer-ux-refresh.test.js` 확장
  - `3D Viewer: WebGL 컨텍스트 풀과 지연 활성화를 사용한다` 추가
- 실패 확인 후 구현 적용, 재실행 통과

### 검증
- `node --test tests/viewer-ux-refresh.test.js` 통과 (4/4)
- `npm run build` 통과
- `npm test` 통과 (45/45)
- `npm run lint` 실패 (`package.json`에 `lint` 스크립트 미정의)

## 3D 누락 파일(404) 복구 및 생성 스크립트 수정 (`3d/scripts/*.mjs`, `3d/*.glb`, `tests/assets-3d-file-integrity.test.js`)

### 문제
- `3d/viewer.html`에서 일부 3D 에셋이 404로 로드 실패
  - `3d-archimedes-sphere-cylinder-20260125.glb`
  - `3d-euler-helix-complex-20260125.glb`
  - `3d-pythagorean-proof-20260125.glb`
- 원인: `assets.json`에 경로가 등록되어 있으나 실제 GLB 파일이 없었고, 생성 스크립트도 GLB 버퍼 규칙 위반으로 실패

### 수정
- 생성 스크립트 3개 수정
  - `3d/scripts/3d-archimedes.mjs`
  - `3d/scripts/3d-euler.mjs`
  - `3d/scripts/3d-pythagorean.mjs`
- `createPrimitive`가 매번 버퍼를 새로 만들던 문제를 고쳐 문서당 단일 버퍼를 사용하도록 변경
- `ASSET_DATE` 환경변수 지원 추가 (`ASSET_DATE=20260125`)로 파일명 날짜를 제어 가능하게 개선
- 수정된 스크립트로 누락 GLB 3개를 실제 생성하여 `3d/` 경로에 복구

### 테스트 (TDD)
- 추가: `tests/assets-3d-file-integrity.test.js`
  - `assets.json`의 `category: "3d"` 항목이 실제 파일을 가리키는지 검증
- 검증 실행:
  - `node --test tests/assets-3d-file-integrity.test.js tests/viewer-ux-refresh.test.js` 통과
  - `npm test` 통과 (44/44)

### 검증
- `npm run build` 통과
- `npm test` 통과 (44/44)
- `npm run lint` 실패 (`package.json`에 `lint` 스크립트 미정의)

## 3D Viewer 렌더 누락 보정 (`3d/viewer.html`, `tests/viewer-ux-refresh.test.js`)

### 문제
- 일부 GLB(예: `3d-geometry-icosahedron-math-20260125`)가 미리보기에서 보이지 않거나 매우 어둡게 렌더링됨
- 원인 패턴: 노멀/머티리얼이 없는 단순 GLB가 기본 PBR 설정으로 로드되어 배경 대비가 낮아짐

### 수정
- `3d/viewer.html`에 메쉬 프리뷰 보정 함수 추가
  - `prepareMeshForPreview`: 노멀 누락 시 `computeVertexNormals()` 적용
  - `tuneMaterialForPreview`: 머티리얼 누락 시 `MeshStandardMaterial` 폴백 적용
  - 기본 PBR(금속도/거칠기 1.0)로 인한 저가시성 상태를 감지해 `metalness`, `roughness`, 색상 보정
  - 모든 메쉬를 `DoubleSide`로 렌더링해 단면 컬링 이슈를 완화
- 에지 라인 색상을 밝게 조정해 형태 인지성을 개선
- GLB 로드 실패 시 콘솔에 에셋 ID 포함 상세 에러를 남기도록 개선

### 테스트 (TDD)
- 추가: `tests/viewer-ux-refresh.test.js`
  - `3D Viewer: 노멀/머티리얼 누락 GLB를 위한 렌더 폴백을 포함한다`
- 실패 확인: `node --test tests/viewer-ux-refresh.test.js` (신규 테스트 1건 실패)
- 구현 후 통과: `node --test tests/viewer-ux-refresh.test.js` (3/3 통과)

### 검증
- `npm run build` 통과
- `npm test` 통과 (43/43)
- `npm run lint` 실패 (`package.json`에 `lint` 스크립트 미정의)

## Main/Gallery + 3D Viewer UI/UX 리디자인 (`build-gallery.js`, `gallery.html`, `3d/viewer.html`)

### 수정
- 메인 서버 루트(`/`)와 `gallery.html` 화면을 동일하게 개선하도록 `build-gallery.js` 템플릿을 리디자인
- 갤러리 시각 방향을 비범한 콘셉트로 변경:
  - `Black Han Sans + IBM Plex Sans KR + IBM Plex Mono` 타이포 조합 적용
  - 다층 배경(그라디언트+그리드 텍스처), 카드 스태거 진입 모션, 캡슐형 액션 버튼 스타일 적용
  - 필터 상태/노출 개수를 보여주는 인사이트 바(`active-filter-label`, `visible-count`) 추가
  - 카드 액션/카테고리 라벨을 한국어로 통일 (`경로 복사`, `아카이브`, `복원`)
- `3d/viewer.html` 전면 재구성:
  - 컨트롤 패널(`control-panel`) 기반 검색(`searchInput`), 정렬(`sortSelect`), 오토 회전 토글(`toggleRotate`) 추가
  - 필터 칩, 결과 카운트(`resultCount`, `resultCountLine`), 활성 필터 표시를 상단 HUD 형태로 제공
  - 카드형 3D 프리뷰를 고대비 네온 톤으로 리디자인하고, 뷰어 리소스 정리(`cleanupViewers`) 로직 추가
  - 모바일 반응형 레이아웃 보강 (900px/560px 구간)

### 테스트 (TDD)
- 추가: `tests/gallery-ux-refresh.test.js`
- 추가: `tests/viewer-ux-refresh.test.js`
- 실패 확인: `node --test tests/gallery-ux-refresh.test.js tests/viewer-ux-refresh.test.js` (초기 3개 실패)
- 구현 후 통과: `node --test tests/gallery-ux-refresh.test.js tests/viewer-ux-refresh.test.js` (4/4 통과)

### 검증
- `node build-gallery.js` 통과
- `npm run build` 통과
- `npm test` 통과 (42/42)
- `npm run lint` 실패 (`package.json`에 `lint` 스크립트 미정의)

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

## Admin UI 라이트 테마 리디자인 (`admin-ui/index.html`, `admin-ui/styles.css`)

### 수정
- 다크 톤 제거 및 라이트 테마 고정 (`color-scheme: light`), 밝은 그라디언트 배경/카드형 레이아웃 적용
- 헤더를 운영 대시보드 톤으로 재구성: kicker 텍스트, 상태 pill, 진입 애니메이션 추가
- 사이드바 폼/슬라이더/통계 카드 스타일 전면 개선 (명확한 대비, 포커스 링, hover 피드백)
- Job 카드 시각 체계 개선: 상태별 상단 스트립, 배지/태그 컬러 분리, 처리 중 pulse 애니메이션 유지
- 로그 패널과 미리보기 모달을 라이트 UI로 통일하고 모바일(980px/620px) 반응형 보강
- 빈 상태 안내 문구를 class 기반으로 정리하여 인라인 스타일 제거

### 테스트
- `tests/admin-ui-theme.test.js` 추가: 라이트 테마 토큰/다크모드 미사용 회귀 검증
- `node --test tests/admin-ui-theme.test.js` 통과
- `node --test tests/admin-integration.test.js` 통과
- `npm run build` 통과

## Admin UI 테마 옵션 추가 (`admin-ui/app.js`, `admin-ui/index.html`, `admin-ui/styles.css`)

### 수정
- 기본 테마를 라이트로 유지하면서 헤더에 테마 전환 버튼(`themeToggle`) 추가
- `localStorage`(`ADMIN_UI_THEME`)에 사용자 선택 테마를 저장/복원하도록 프론트 로직 추가
- CSS에 `[data-theme='dark']` 변수/컴포넌트 오버라이드 추가로 다크 테마 선택 가능하게 확장

### 테스트
- `tests/admin-ui-theme.test.js` 확장: 라이트 기본 + 다크 옵션 + 토글/저장 키 검증
- `tests/admin-integration.test.js` 보강: 필수 DOM ID 목록에 `themeToggle` 검증 추가
- `node --test tests/admin-ui-theme.test.js` 통과
- `node --test tests/admin-integration.test.js` 통과
- `npm test` 통과 (33/33)
- `npm run build` 통과
- `npm run lint` 실패 (루트 `package.json`에 lint 스크립트 미정의)

## Admin UI 관제형 인덱스 리디자인 (`admin-ui/index.html`, `admin-ui/styles.css`, `admin-ui/app.js`)

### 수정
- 헤더를 관제실 콘셉트로 재구성: `hero-signal`, 실시간 시계/날짜(`opsClock`, `opsDate`), 연결 상태, KPI 마퀴(`kpi-marquee`) 추가
- 배경 레이어를 강화: `orbital-backdrop`, `noise-layer`로 화면 깊이와 분위기 연출
- 사이드바/메인/로그/모달 전반의 색상, 타이포, 대비, 인터랙션을 일관된 컨트롤룸 스타일로 전면 리디자인
- Job 카드 처리 중 상태에 스캔 라이트 애니메이션(`processing-scan`)을 추가해 진행 상황 인지성 개선
- 접근성 보강: `prefers-reduced-motion` 환경에서 마퀴/스캔/진입 애니메이션 비활성화
- `app.js`에 상단 시계/날짜 갱신 로직 및 상단 KPI 숫자 동기화 로직 추가
- 통합 테스트 계약 문자열 호환을 위해 제목에 `AI 교육 콘텐츠 생성기` 문구 유지

### 테스트
- `tests/admin-ui-aesthetic.test.js` 추가 (TDD):
  - 1차 실행 실패 확인 (`hero-signal`, `opsClock`, `orbital-backdrop`, `marquee-flow` 미존재)
  - 구현 후 재실행 통과
- `node --test tests/admin-ui-theme.test.js` 통과
- `node --test tests/admin-integration.test.js` 통과
- `npm test` 통과 (35/35)
- `npm run build` 통과
- `npm run lint` 실패 (루트 `package.json`에 `lint` 스크립트 미정의)

## Admin 미리보기 개선: 기존 생성 컨텐츠 자동 노출 (`api/src/admin-server.ts`, `tests/admin-integration.test.js`)

### 수정
- `GET /api/admin/jobs`에서 기존 Job 저장소 결과와 `edu-content/*/index.html` 스캔 결과를 병합하도록 변경
- Job 저장소에 없는 모듈은 `existing-{moduleId}` 형식의 가상 Job으로 반환
- 기존 모듈 가상 Job은 `status: completed`, `jobType: generate`, `modulePath: edu-content/{moduleId}`로 제공하여 Admin 미리보기 버튼이 즉시 활성화되도록 개선
- 응답 목록을 `createdAt` 내림차순으로 정렬하여 최신 항목 우선 노출

### 테스트
- TDD로 통합 테스트 추가: `GET /api/admin/jobs: 기존 edu-content 미리보기 항목 포함`
- 실패 재현 후 구현 적용 및 재실행 통과
- `node tests/admin-integration.test.js` 통과 (14/14)
- `npm test` 통과 (35/35)
- `npm run build --prefix api` 통과
- `npm run build` 통과

## Job 보존/복구 강화: TTL 확장 + 백필 스크립트 (`api/src/job-manager.ts`, `scripts/backfill-jobs.js`)

### 수정
- Job 만료 시간을 `JOB_TTL_MS` 환경변수로 제어하도록 변경
  - 기본값: `604800000` (7일)
  - `0` 이하 설정 시 만료 정리 비활성화
- `.env.example`에 `JOB_TTL_MS` 설정 예시를 추가
- `scripts/backfill-jobs.js` 추가:
  - `edu-content/*/index.html`를 스캔해 누락된 `completed` Job을 `jobs.json`에 백필
  - 이미 `modulePath`가 존재하는 항목은 중복 생성하지 않음
- 루트 `package.json`에 `backfill:jobs` 스크립트 추가

### 테스트
- `tests/api-job-manager-ttl.test.js` 추가: `JOB_TTL_MS=0`일 때 만료 삭제 비활성화 검증
- `tests/backfill-jobs.test.js` 추가: 백필 생성 및 중복 방지 검증
- `tests/api-job-manager.test.js`에서 TTL 테스트 안정화를 위해 `JOB_TTL_MS=3600000` 고정
- `npm test` 통과 (37/37)
- `npm run build --prefix api` 통과
- `npm run build` 통과
- `npm run lint` 실패 (루트 `package.json`에 `lint` 스크립트 미정의)
