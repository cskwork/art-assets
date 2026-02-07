# Phase 06: 생성 품질 강화 + Admin UI 폴리시 + Production Ready

이 Phase에서는 전체 시스템의 품질을 강화하고, Admin UI를 프로덕션 수준으로 폴리시하며, 에러 핸들링, 로깅, 모니터링을 완성한다. 최종적으로 `npm start`로 전체 시스템이 안정적으로 동작하는 프로덕션 레디 상태를 달성한다.

## Tasks

- [ ] 생성 품질 강화 - 콘텐츠 검증 규칙 확장:
  - `api/src/agents/reviewer-agent.ts`를 읽고 현재 리뷰 로직을 확인한다
  - `api/src/llm/review.ts`를 읽고 기존 deterministic 검증을 확인한다
  - 리뷰 규칙 확장:
    - HTML 유효성: DOCTYPE 선언, meta charset=UTF-8, viewport 메타태그
    - 접근성: 이미지 alt 속성, 버튼 aria-label, 키보드 네비게이션 가능
    - 반응형: viewport 메타태그, 미디어 쿼리 또는 유연한 레이아웃 존재
    - 콘텐츠 유형별 필수 요소:
      - Phaser: `new Phaser.Game(config)` 존재, config.type/width/height 설정
      - Three.js: `new THREE.Scene()`, `new THREE.PerspectiveCamera()`, `renderer.render()` 존재
    - 교육 품질: 퀴즈 씬에 최소 3개 문제, 정답 피드백 존재
    - 점수 기준 조정: 70점 미만 자동 수정, 85점 이상만 최종 통과
  - 자동 수정 프롬프트 개선: 이슈별 구체적 수정 지침 포함

- [ ] Admin UI 프로덕션 폴리시:
  - `admin-ui/index.html`, `admin-ui/styles.css`, `admin-ui/app.js`를 읽는다
  - UI/UX 개선:
    - 로딩 상태: 스켈레톤 로더 (Job 카드, 설정 패널)
    - 토스트 알림: 생성 시작, 완료, 실패 시 우상단 토스트 메시지
    - 확인 다이얼로그: 무한 루프 시작/중지 전 확인 모달
    - 키보드 단축키: Ctrl+G (생성 시작), Ctrl+S (루프 중지), Escape (모달 닫기)
    - 반응형 레이아웃: 모바일에서도 사용 가능한 레이아웃 (사이드바 접기)
  - 대시보드 통계 패널:
    - 총 생성 수, 성공률, 평균 품질 점수
    - 과목별/유형별 생성 분포 차트 (순수 CSS 또는 Chart.js)
    - 최근 24시간 생성 타임라인
  - 콘텐츠 미리보기 개선:
    - iframe 미리보기에 새로고침 버튼
    - 전체화면 모드
    - 모바일/데스크톱 뷰 토글 (iframe 크기 조절)
  - 에러 상태 표시 개선:
    - 실패한 Job의 에러 상세 표시
    - Playwright 스크린샷 인라인 표시
    - "재생성" 버튼으로 실패한 콘텐츠 재시도

- [ ] 에러 핸들링 및 로깅 시스템 강화:
  - `api/src/logger.ts`를 읽고 현재 로깅 구조를 확인한다
  - 로깅 시스템 확장:
    - 로그 레벨: DEBUG, INFO, WARN, ERROR
    - 파일 로깅: `api/data/logs/` 디렉토리에 날짜별 로그 파일 (`YYYY-MM-DD.log`)
    - 구조화된 로그: JSON 형식 `{ timestamp, level, module, message, data? }`
    - 로그 로테이션: 7일 이상 된 로그 파일 자동 삭제
  - 에러 핸들링 강화:
    - 전역 uncaughtException / unhandledRejection 핸들러
    - API 라우트별 try-catch 미들웨어
    - Claude Agent SDK 호출 실패 시 재시도 (최대 2회, exponential backoff)
    - Playwright 타임아웃 에러 시 graceful 실패 처리
  - Admin API에 로그 조회 엔드포인트 추가:
    - `GET /api/admin/logs?level=ERROR&limit=50` -> 최근 로그 반환
    - Admin UI에 로그 뷰어 탭 추가

- [ ] 전체 시스템 End-to-End 테스트 작성:
  - `tests/e2e-system.test.js` 생성:
    - 서버 기동 테스트: Admin 서버 시작, health check 응답 확인
    - Admin Config API 테스트: 과목/유형/학년 목록 반환 확인
    - Batch Generate API 테스트: 수량 1 요청 -> Job 생성 -> 상태 폴링 -> 완료 확인
    - 콘텐츠 파일 생성 확인: edu-content/ 디렉토리에 index.html, script.js, style.css 존재
    - WebSocket 테스트: 이벤트 수신 확인 (ws 클라이언트 사용)
    - Loop Engine 테스트: 시작 -> 1회 생성 -> 중지 순서 검증

- [ ] End-to-End 테스트 실행 및 최종 검증:
  - `cd api && npm run build` 최종 빌드
  - `npm test` 전체 테스트 스위트 실행
  - 실패한 테스트 수정 후 재실행
  - 서버 수동 기동 후 Admin UI 브라우저 테스트:
    - 대시보드 로딩 확인
    - 수동 모드로 콘텐츠 1개 생성 요청
    - Job 상태 실시간 업데이트 확인
    - 생성 완료 후 콘텐츠 미리보기 확인
  - 루트 `package.json` scripts 최종 확인:
    - `"start"`: 프로덕션 서버 시작
    - `"dev"`: 개발 모드 (watch + 서버)
    - `"build"`: TypeScript 컴파일 + 갤러리 빌드
    - `"test"`: 전체 테스트 실행
  - `docs/changelog/changelog-2026-02-07.md`에 최종 폴리시 내역 추가
  - `CLAUDE.md` 업데이트: 새로운 Admin 서버, Agent Pipeline, 무한 루프 관련 문서 추가
