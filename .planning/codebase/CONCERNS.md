# 코드베이스 우려사항

**분석 날짜:** 2026-02-15

## 기술 부채

### 1. 파일 시스템 기반 데이터 저장의 동시성 문제

**문제:** Job 및 Batch 저장소가 JSON 파일 기반이며, 직렬 읽기/쓰기만 지원
- **파일:** `api/src/job-manager.ts`, `api/src/batch-manager.ts`
- **영향:**
  - 고부하 시 데이터 손실 위험 (여러 인스턴스에서 동시 쓰기)
  - 경합 조건(race condition)으로 인한 일관성 문제
  - 대규모 Job 저장소 확장성 저하
- **수정 방법:**
  - SQLite, PostgreSQL 등 데이터베이스 마이그레이션 검토
  - 파일 기반 유지 시 파일 락(lock) 메커니즘 구현
  - 현재는 단일 프로세스 환경에서만 안전

### 2. API 타임아웃 설정이 고정적

**문제:** Z.ai API 타임아웃이 10분(600초)로 고정, 장시간 작업에 부족할 수 있음
- **파일:** `api/src/llm/zai-client.ts:27`
- **코드:** `const DEFAULT_TIMEOUT_MS = 600000; // 10분`
- **영향:**
  - 복잡한 콘텐츠 생성(사진 처리, 3D 모델)에서 타임아웃 발생 가능
  - 재시도 메커니즘으로 인한 과도한 API 호출
  - 예측 불가능한 실패 경험
- **수정 방법:**
  - `TIMEOUT_MS` 환경변수로 설정 가능하게 변경
  - 콘텐츠 유형별 다양한 타임아웃 설정
  - API 진행 로깅으로 타임아웃 원인 파악

### 3. 콘텐츠 생성 재시도 로직의 무한 루프 위험

**문제:** `maxGenAttempts`와 `maxParsingAttempts` 재시도가 독립적으로 작동, 총 재시도 횟수 제한 없음
- **파일:** `api/src/content-generator.ts:400-475`
- **영향:**
  - 병목 항목에 대한 무제한 재시도로 API 비용 폭증 가능
  - 오류 상황에서 사용자 대기 시간 급증
  - 예산 한도 초과 가능성
- **수정 방법:**
  - 전체 재시도 예산(budget) 설정 (예: `max-retries=3`)
  - 지수 백오프(exponential backoff) 구현
  - 재시도 비용을 모니터링하고 경고

### 4. 에러 응답 세분화 부족

**문제:** 모든 API 오류가 일반적인 `INTERNAL_ERROR`로 묶임
- **파일:** `api/src/types.ts:87-92`
- **코드:**
  ```typescript
  export type ErrorCode =
    | 'INVALID_SUBJECT'
    | 'INVALID_REQUEST'
    | 'JOB_NOT_FOUND'
    | 'MODULE_NOT_FOUND'
    | 'INTERNAL_ERROR';
  ```
- **영향:**
  - 클라이언트가 오류 원인을 파악 어려움
  - 자동 재시도 결정 불가
  - 환경 설정 오류와 네트워크 오류를 구분 불가
- **수정 방법:**
  - `API_KEY_MISSING`, `API_TIMEOUT`, `RATE_LIMITED`, `INVALID_CONTENT` 등으로 세분화
  - 각 오류에 권장 조치(retry, configure, check-logs) 추가

### 5. Job TTL 정리의 성능 오버헤드

**문제:** Job 정리가 폴링 방식이며, 모든 Job을 순회하며 확인
- **파일:** `api/src/job-manager.ts:99-135`
- **영향:**
  - Job 저장소가 커질수록 정리 시간 증가
  - 대규모 프로덕션에서 주기적 지연 발생
  - 인덱싱 없음
- **수정 방법:**
  - 생성일 기준 인덱스 추가
  - 만료된 Job만 선택적 정리
  - 비동기 백그라운드 정리로 분리

## 보안 문제

### 1. 환경 변수 노출 위험

**문제:** 생성된 콘텐츠 모듈에 `.claude` 설정 디렉토리가 포함될 수 있음
- **파일:** `api/src/content-generator.ts:325-345`
- **영향:**
  - `.env` 파일이 실수로 생성된 모듈에 포함될 경우 API 키 노출
  - 클라이언트 측 코드 실행 시 민감 정보 접근
- **수정 방법:**
  - `.env` 파일을 아예 모듈에 포함하지 않도록 강제
  - `process.env` 접근 금지 규칙 추가
  - 생성 후 검증: 민감 키워드 스캔

### 2. 경로 탐색(Path Traversal) 취약점 부분 완화

**문제:** 파일 쓰기 검증이 있지만, 심볼릭 링크 공격은 미고려
- **파일:** `api/src/content-generator.ts:103-127`
- **코드:**
  ```typescript
  function isAllowedWritePath(filePath: string, rootDir: string) {
    const resolvedPath = path.resolve(rootDir, filePath);
    // ...
  }
  ```
- **영향:**
  - 심볼릭 링크를 통한 `edu-content` 외부 쓰기 가능성
  - 시스템 파일 덮어쓰기 가능
- **수정 방법:**
  - `fs.realpath()` 사용하여 심볼릭 링크 정규화
  - 안전성 검증 후 파일 쓰기

### 3. CORS 설정이 너무 개방적

**문제:** admin-server.ts에서 모든 origin에 CORS 허용
- **파일:** `api/src/admin-server.ts:83`
- **코드:** `app.use(cors());`
- **영향:**
  - 모든 웹사이트에서 API 호출 가능
  - CSRF 공격 가능성
- **수정 방법:**
  - `ALLOWED_ORIGINS` 환경변수로 화이트리스트 설정
  - 개발(localhost), 스테이징, 프로덕션 환경별 다른 설정

### 4. 입력 검증 부족 (Subject)

**문제:** `subject` 필드 검증이 TypeScript 타입에만 의존
- **파일:** `api/src/index.ts:148-180`
- **영향:**
  - 클라이언트가 invalid subject 전송 시 런타임 오류
  - 타입스크립트는 런타임에서 무시됨
- **수정 방법:**
  - Zod, Joi 등 런타임 검증 라이브러리 도입
  - 모든 입력에 대한 명시적 검증 규칙 적용

## 성능 병목

### 1. Edu-Content 모듈의 대규모 JavaScript 파일

**문제:** 일부 모듈의 script.js가 700~900줄에 달함
- **파일:**
  - `edu-content/20260209-world-quiz-battle/script.js`: 840줄
  - `edu-content/20260127-prepositions-3d/script.js`: 791줄
  - `edu-content/20260127-3d-coordinates/script.js`: 738줄
- **영향:**
  - 파일 로드 시간 증가
  - 모바일 환경에서 메모리 부족
  - 코드 유지보수 어려움
- **수정 방법:**
  - 기능별로 모듈 분리 (Scene 클래스, Utils 분리)
  - Three.js/Phaser 씬별 Lazy Loading
  - 번들러(webpack, rollup) 도입하여 최소화

### 2. 갤러리 빌드 시간

**문제:** `build-gallery.js`에서 모든 에셋을 메모리에 로드한 후 HTML 생성
- **파일:** `build-gallery.js`
- **영향:**
  - 에셋 수 증가 시 빌드 속도 선형 증가
  - 큰 3D 모델(GLB) 로드 시 메모리 폭증 가능
- **수정 방법:**
  - 스트림 기반 생성으로 메모리 사용 최소화
  - 에셋 메타데이터만 로드하고, 경로는 동적 생성
  - 빌드 병렬화

### 3. Three.js 모델 로드의 성능 이슈

**문제:** GLB 모델이 글로벌 `window.THREE` 변수에 의존하여 프리로딩 어려움
- **파일:** `edu-content/20260127-prepositions-3d/script.js` 등
- **영향:**
  - 모든 Three.js 모듈이 같은 인스턴스 공유
  - 메모리 누수 가능 (cleanup 없음)
  - 동시에 여러 3D 장면 로드 시 충돌
- **수정 방법:**
  - ContentApp 싱글톤 대신 스코프된 인스턴스 사용
  - Scene별 리소스 cleanup 강제
  - WebGL context loss 처리

## 테스트 커버리지 부족

### 1. 통합 테스트 미흡

**문제:** API → Job Manager → File System → 생성된 모듈 전체 경로 테스트 없음
- **영향:**
  - 엣지 케이스(edge cases) 발견 어려움
  - 배포 후 버그 발견
- **수정 방법:**
  - E2E 테스트 추가 (콘텐츠 생성 → 파일 검증 → 모듈 실행)
  - Mock Z.ai API로 결정적 테스트

### 2. 에러 시나리오 테스트 부족

**문제:** Z.ai API 타임아웃, 부분 응답, 잘못된 JSON 등에 대한 테스트 부족
- **파일:** `tests/api-zai-client.test.js` 등
- **영향:**
  - 프로덕션에서 예상 밖의 오류 발생
  - 재시도 로직의 동작 미검증
- **수정 방법:**
  - 타임아웃, 네트워크 오류, 부분 응답에 대한 테스트 추가
  - Mock API 응답으로 결정적 테스트
  - 카오스 엔지니어링 도입

## 구조적 문제

### 1. ContentApp 싱글톤 패턴의 재사용성 제한

**문제:** 모든 edu-content 모듈이 전역 `ContentApp` 객체에 의존하여 테스트 및 재사용 어려움
- **파일:** `edu-content/*/script.js`
- **영향:**
  - 동일 모듈을 한 페이지에서 여러 번 로드 불가
  - 호이스팅(hoisting) 시 상태 충돌
  - 단위 테스트 불가
- **수정 방법:**
  - ContentApp을 클래스 인스턴스로 변경
  - 각 모듈이 독립적인 인스턴스 생성
  - 데이터 격리

### 2. 프롬프트 파일 관리 부족

**문제:** 프롬프트가 파일 시스템에서 로드되지만, 버전 관리 및 A/B 테스팅 미지원
- **파일:** `api/src/prompt-loader.ts:1-100`
- **영향:**
  - 프롬프트 변경 시 버전 추적 불가
  - 다른 프롬프트로 비교 테스트 불가
- **수정 방법:**
  - 프롬프트 버전 시스템 추가 (v1, v2, ...)
  - A/B 테스트 지원 (`prompts/generate-content-v1.md`, `v2.md`)
  - 프롬프트 성능 메트릭 추적

## 운영 및 모니터링 부족

### 1. 구조화된 로깅 부재

**문제:** 콘솔 로그만 사용, JSON 구조화 로깅이 없음
- **파일:** `api/src/logger.ts`
- **영향:**
  - 프로덕션 로그 검색 및 분석 어려움
  - 성능 메트릭 추출 불가
  - 에러 추적(APM) 통합 불가
- **수정 방법:**
  - Winston, Pino 등으로 구조화 로깅 전환
  - `jobId`, `subject`, `duration` 등 컨텍스트 정보 추가
  - ELK Stack 또는 Datadog 통합

### 2. 헬스 체크 엔드포인트 부재

**문제:** `/health` 같은 상태 확인 엔드포인트가 없음
- **영향:**
  - 배포 자동화에서 준비 상태 확인 불가
  - 부분 장애(partial outages) 감지 어려움
- **수정 방법:**
  - `/health` 엔드포인트 추가 (Job store, Z.ai API 연결성 확인)
  - `/metrics` 엔드포인트로 Prometheus 지표 제공

### 3. Rate Limiting 부재

**문제:** API에 Rate Limiting이 없어 악용 가능
- **파일:** `api/src/admin-server.ts`
- **영향:**
  - 과도한 콘텐츠 생성 요청으로 인한 API 비용 폭증
  - DoS 공격 가능성
- **수정 방법:**
  - `express-rate-limit` 도입
  - IP 또는 API 키 기반 Rate Limiting
  - 사용자별 일일 생성 한도 설정

## 알려진 버그

### 1. Job 정리 후 WebSocket 동기화 문제

**문제:** Job이 TTL로 인해 정리될 때, 연결된 클라이언트에 알림 없음
- **파일:** `api/src/admin-server.ts:99-115`
- **영향:**
  - 클라이언트가 삭제된 Job의 상태를 요청할 수 있음
  - 폴링 중인 클라이언트가 갑자기 404 받음
- **수정 방법:**
  - Job 정리 시 WebSocket 브로드캐스트 추가
  - 클라이언트 측에서 404 처리 (정리되었음을 표시)

### 2. 부분 생성 파일의 정리 부재

**문제:** 콘텐츠 생성이 중간에 실패하면 부분 생성된 파일이 남음
- **파일:** `api/src/content-generator.ts:600-650`
- **영향:**
  - 디스크 공간 낭비
  - 다음 실행에서 경로 충돌 가능
- **수정 방법:**
  - Job 생성 시 임시 디렉토리 사용
  - 성공 시에만 최종 위치로 이동
  - 실패 시 자동 정리

## 취약한 영역

### 1. Z.ai API 응답 파싱

**파일:** `api/src/llm/zai-output.ts`, `api/src/llm/review.ts`
- **문제:**
  - JSON 추출 정규식이 완벽하지 않음
  - 예상 밖의 마크다운 형식에 취약
  - 생각(thinking) 블록 제거 로직이 불완전할 수 있음
- **위험도:** 높음
- **안전한 수정:**
  - JSON Schema 검증 추가
  - 부분 파싱 실패 시 구조화된 재시도
  - 파싱 실패 로그 수집 및 분석

### 2. Admin UI 파일 업로드 (향후 기능)

**파일:** `admin-ui/app.js`
- **문제:**
  - 현재 파일 업로드 없음
  - 향후 추가 시 파일 검증 필수
- **위험도:** 높음 (향후)
- **안전한 수정:**
  - MIME 타입 검증
  - 파일 크기 제한
  - 바이러스 스캔 (ClamAV)
  - 샌드박스 처리

### 3. Edu-Content 모듈의 외부 스크립트 로드

**파일:** `edu-content/*/index.html`
- **문제:**
  - CDN에서 Three.js, Phaser, MathJax 등을 로드
  - CDN 다운 또는 변조 시 콘텐츠 작동 불가
- **위험도:** 중간
- **안전한 수정:**
  - SRI(Subresource Integrity) 해시 추가
  - 대체 CDN 설정
  - 로컬 폴백(fallback) 제공

## 마이그레이션/개선 우선순위

| 우선순위 | 영역 | 기대 효과 | 난이도 |
|----------|------|---------|--------|
| **높음** | Rate Limiting 추가 | 비용 관리, 보안 | 낮음 |
| **높음** | 에러 코드 세분화 | 디버깅 개선, UX | 중간 |
| **높음** | 경로 탐색 완전 완화 | 보안 | 낮음 |
| **중간** | 구조화 로깅 | 운영성, 모니터링 | 중간 |
| **중간** | Job TTL 인덱싱 | 성능, 확장성 | 중간 |
| **중간** | 헬스 체크 엔드포인트 | 배포 자동화 | 낮음 |
| **낮음** | ContentApp 싱글톤 리팩토링 | 재사용성, 테스트 | 높음 |
| **낮음** | 3D 모듈 코드 분리 | 성능, 유지보수 | 높음 |

---

*우려사항 감사: 2026-02-15*
