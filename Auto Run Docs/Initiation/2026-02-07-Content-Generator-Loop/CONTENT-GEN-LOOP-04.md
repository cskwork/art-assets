# Phase 04: Playwright 브라우저 테스트 Agent + 자동 검증

이 Phase에서는 Playwright를 활용하여 생성된 교육 콘텐츠를 실제 브라우저에서 자동으로 테스트하는 Agent를 구현한다. 각 콘텐츠 모듈을 브라우저에서 열어 7씬 네비게이션, 인터랙션 요소, JavaScript 에러, 시각적 렌더링을 검증하고, 실패 시 스크린샷을 캡처하여 자동 수정 루프에 피드백한다.

## Tasks

- [ ] Playwright 설치 및 테스트 인프라 설정:
  - Playwright 패키지 설치: `npm install -D @playwright/test playwright`
  - Playwright 브라우저 설치: `npx playwright install chromium` (Chromium만 설치하여 경량화)
  - `playwright.config.ts` 생성 (프로젝트 루트):
    - baseURL: `http://localhost:3000`
    - 브라우저: Chromium headless
    - 스크린샷: 실패 시 자동 캡처
    - 타임아웃: 30초
    - 출력 디렉토리: `test-results/`
  - `.gitignore`에 `test-results/`, `playwright-report/` 추가

- [ ] 콘텐츠 검증 Agent 구현 (`api/src/agents/tester-agent.ts`):
  - `TesterAgent` 클래스 생성:
    - `testModule(moduleId: string)`: 단일 모듈 전체 테스트 실행
    - `testSceneNavigation(page, moduleId)`: 7씬 순서대로 네비게이션 테스트
      - "다음" 버튼 클릭으로 씬 전환
      - 각 씬이 visible 상태인지 확인
      - 7개 씬 모두 방문 확인
    - `testInteractions(page, moduleId, contentType)`:
      - Phaser: canvas 요소 존재, Phaser.Game 인스턴스 로드 확인
      - Three.js: canvas 요소 존재, THREE.Scene 렌더링 확인
      - 슬라이더/드래그 요소가 있으면 기본 인터랙션 시뮬레이션
    - `testConsoleErrors(page)`: 브라우저 콘솔 에러 수집
      - console.error 이벤트 리스너
      - JavaScript 예외 캡처
      - 404 리소스 에러 감지
    - `testVisualRendering(page, moduleId)`: 시각적 렌더링 검증
      - 페이지 스크린샷 캡처 (각 씬별)
      - 빈 화면 감지 (화면 픽셀 분석 또는 주요 요소 visibility)
      - 한국어 텍스트 존재 확인 (`lang="ko"`, 한글 문자 검색)
    - `captureFailureReport(page, moduleId, errors[])`: 실패 보고서 생성
      - 에러 스크린샷 저장: `test-results/{moduleId}/`
      - 에러 로그 저장: `test-results/{moduleId}/errors.json`
      - 보고서 생성: `test-results/{moduleId}/report.md`
  - 반환 타입: `TestResult { pass, score, errors[], screenshots[], consoleErrors[] }`

- [ ] 파이프라인에 테스트 단계 통합:
  - `api/src/agents/pipeline.ts`를 읽고 현재 단계 구조를 확인한다
  - 파이프라인 단계 확장: `research -> generate -> review -> test -> fix -> finalize`
  - `test` 단계에서 TesterAgent 실행:
    - 서버가 실행 중인지 확인 (localhost:3000 접근 가능)
    - `TesterAgent.testModule(moduleId)` 실행
    - 테스트 통과 시: `finalize` 단계로 진행
    - 테스트 실패 시: 에러 정보를 `fix` 단계로 전달, 자동 수정 후 재테스트 (최대 2회)
  - WebSocket 이벤트 추가:
    - `{ type: 'test_start', jobId, moduleId }`
    - `{ type: 'test_result', jobId, moduleId, pass, score, errors[] }`
    - `{ type: 'test_screenshot', jobId, moduleId, screenshotPath }`

- [ ] Admin UI에 테스트 결과 표시 추가:
  - `admin-ui/index.html`과 `admin-ui/app.js`를 읽고 현재 UI를 확인한다
  - Job 카드에 테스트 상태 표시:
    - "테스트 중" 상태: 브라우저 아이콘 + 로딩 스피너
    - "테스트 통과" 상태: 초록 체크 + 점수 표시
    - "테스트 실패" 상태: 빨강 X + 에러 수 표시 + "상세보기" 버튼
  - 테스트 상세 모달:
    - 각 씬별 스크린샷 갤러리
    - 콘솔 에러 목록
    - 재테스트 버튼
  - `admin-ui/styles.css`에 테스트 관련 스타일 추가

- [ ] Playwright 테스트 검증 (기존 edu-content 모듈로):
  - 기존 `edu-content/` 디렉토리에서 모듈 하나를 선택한다 (예: `20260126-box-volume`)
  - 서버를 시작하고 TesterAgent로 해당 모듈 테스트 실행
  - 7씬 네비게이션이 정상 작동하는지 확인
  - 콘솔 에러가 없는지 확인
  - 스크린샷이 `test-results/` 디렉토리에 저장되는지 확인
  - 테스트 에러가 있으면 TesterAgent 로직 수정

- [ ] 빌드 및 통합 검증:
  - `cd api && npm run build` 컴파일 확인 및 에러 수정
  - `npx playwright test --reporter=list` 로 Playwright 설정 검증
  - Admin UI에서 Job 카드의 테스트 상태 표시가 정상인지 확인
  - `docs/changelog/changelog-2026-02-07.md`에 Playwright 테스트 Agent 구현 내역 추가
