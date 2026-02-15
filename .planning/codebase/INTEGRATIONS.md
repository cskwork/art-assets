# 외부 연동

**분석 날짜:** 2026-02-15

## APIs & 외부 서비스

### LLM 서비스 (필수 선택)

#### Z.ai API (GLM) - 기본 제공자
- **서비스**: Z.ai PaaS API (중국 AI 회사)
- **목적**: 한국 학생용 교육 콘텐츠 자동 생성
- **엔드포인트**: `https://api.z.ai/api/paas/v4/chat/completions`
- **SDK/클라이언트**: 내부 구현 (`api/src/llm/zai-client.ts`)
- **인증**: 환경 변수 `ZAI_API_KEY` (Bearer token)
- **지원 모델**:
  - `glm-4.7` (기본값) - 일반 콘텐츠 생성
  - `glm-5` - 향상된 성능, thinking 파라미터 지원
- **요청 형식**:
  ```typescript
  POST https://api.z.ai/api/paas/v4/chat/completions
  Authorization: Bearer {ZAI_API_KEY}
  Content-Type: application/json

  {
    "model": "glm-4.7",
    "messages": [...],
    "stream": true,
    "max_tokens": 65536,
    "temperature": 1.0,
    "thinking": { "type": "enabled" }  // GLM-5만
  }
  ```
- **응답**: Server-Sent Events (SSE) 스트림
  - delta.content 필드 누적
  - thinking 블록 자동 제거
  - finish_reason: "stop" | "length"
- **타임아웃**: 600초 (10분)
- **위치**: `api/src/llm/zai-client.ts` (streamZaiChat 함수)

#### Claude API - 대체 제공자
- **서비스**: Anthropic Claude API
- **목적**: Z.ai 대신 사용 가능한 대체 LLM
- **SDK/클라이언트**: `@anthropic-ai/claude-agent-sdk` 0.2.19
- **인증**: 환경 변수 `ANTHROPIC_API_KEY`
- **활성화**: `LLM_PROVIDER=claude` 설정
- **위치**: `api/src/content-generator.ts`
  - 동적 임포트로 필요 시에만 로드
  - Claude Agent SDK의 특정 기능 활용
- **주의**: SDK 미설치 시 에러 메시지 가이드

## 데이터 저장

### 파일 기반 저장소
- **작업 저장소**: `api/data/jobs.json`
  - 포맷: JSON (version + jobs 배열)
  - 용도: 생성/검토 작업의 상태 추적
  - 지속성: 서버 재시작 후에도 유지
  - TTL: `JOB_TTL_MS` (기본 7일) 후 자동 삭제

- **배치 저장소**: `api/data/batches.json`
  - 포맷: JSON
  - 용도: 대량 생성 작업 관리

- **에셋 인덱스**: `assets-index.json`
  - 포맷: JSON (compact 형식)
  - 용도: LLM 프롬프트에 에셋 정보 제공
  - 필드: id, category (c), tags (t), description (d)

### 데이터베이스
- **유형**: 없음 (파일 기반만 사용)
- **SQL/NoSQL**: 미적용
- **메모리 저장소**: Map<jobId, Job> (in-memory, 시작 시 disk 로드)

## 파일 저장

### 로컬 파일시스템 (전체)
- **에셋 위치**: 루트의 각 카테고리 폴더
  - `icons/` - SVG 아이콘
  - `illustrations/` - SVG/PNG 일러스트
  - `diagrams/` - SVG/PNG 다이어그램
  - `backgrounds/` - JPG/PNG 배경
  - `photos/` - JPG 사진
  - `3d/` - GLB/GLTF 3D 모델
  - `archive/` - 아카이브된 에셋 (카테고리별)

- **생성된 콘텐츠**: `edu-content/{moduleId}/`
  - index.html, script.js, style.css 자동 생성
  - 디렉토리 네이밍: `{YYYYMMDD}-{topic-slug}` 또는 `{YYYYMMDD}-{topic-slug}-v{N}`

- **갤러리 산출물**:
  - `gallery.html` - 빌드 시 생성
  - `assets.json` - 빌드 시 생성
  - `assets-source.json` - 소스 (수동 편집)

**CDN 기반 리소스:**
- Three.js CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- Phaser CDN: `https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js`
- MathJax CDN: `https://cdn.jsdelivr.net/npm/mathjax@3/...`

## 인증 & 보안

### API 키 관리
- **Z.ai API Key**: `ZAI_API_KEY` (환경 변수)
  - 형식: sk-... (Bearer token)
  - 저장: `.env` 파일 (git ignored)
  - 노출 위험: 직접 API 호출에 사용되므로 중요

- **Claude API Key**: `ANTHROPIC_API_KEY` (환경 변수)
  - 형식: sk-ant-... (Bearer token)
  - 저장: `.env` 파일 (git ignored)
  - 선택 사항: `LLM_PROVIDER=claude` 설정 시만 필요

### 기본 보안
- **CORS**: express-cors 미들웨어로 모든 출처 허용 (`app.use(cors())`)
- **경로 탐색 공격**: `ROOT_DIR` 범위 내 접근만 허용 (archive.js에서)
- **입력 검증**: 요청 데이터 타입, 길이 검증 (validateGenerateContentRequest)
- **API 토큰**: 헤더에 Bearer token (노출되지 않아야 함)

## 모니터링 & 옵저버빌리티

### 에러 추적
- **방식**: 없음 (내부 에러 로깅)
- **대안**: 개발 중 콘솔 로깅 (`api/src/logger.ts`)

### 로그
- **방식**: 콘솔 출력 (stdout)
- **구현**: 커스텀 logger (`api/src/logger.ts`)
  - LogTag: 'API', 'LLM', 'Review', 'Build' 등
  - logProgress(): 경과 시간 및 문자 수 진행 상황
  - logSize(): 요청/응답 크기 추적

## CI/CD & 배포

### 호스팅
- **배포 대상**: Node.js 가능한 환경 (Vercel, Heroku, 자체 서버 등)
- **패키지 배포**: npm으로 배포 가능 (public 아님)
- **프로덕션 실행**: `node api/dist/admin-server.js`

### 빌드 파이프라인
- **CI/CD 도구**: 없음 (내부 빌드 스크립트)
- **빌드 명령**:
  ```bash
  npm run build  # TypeScript 빌드 + 갤러리 생성
  ```

## 웹훅 & 콜백

### 들어오는 웹훅
- **형식**: 없음 (수동 API 호출만 지원)

### 나가는 웹훅/콜백
- **WebSocket 브로드캐스트**:
  - 엔드포인트: `ws://localhost:3000/ws`
  - 목적: 작업 상태 실시간 업데이트
  - 메시지: `{ type: 'job_created', job: {...} }` 등
  - 위치: `api/src/admin-server.ts` (broadcastJobUpdate)

## 환경 설정

### 필수 환경 변수
```
ZAI_API_KEY               # Z.ai API 인증 키 (필수)
```

### 선택 환경 변수
```
LLM_PROVIDER              # "zai" (기본) 또는 "claude"
ANTHROPIC_API_KEY         # Claude 사용 시
ZAI_API_URL              # Z.ai 엔드포인트 (기본값 사용 시 생략)
ADMIN_PORT               # 관리 서버 포트 (기본 3000)
PORT                     # 폴백 포트 (ADMIN_PORT 우선)
PROJECT_ROOT             # 프로젝트 루트 (기본 현재 디렉토리)
JOB_STORE_PATH           # 작업 저장소 경로
JOB_TTL_MS               # 작업 만료 시간 (밀리초)
WS_ENABLED               # WebSocket 활성화 (기본 true)
ASYNC_JOBS_ENABLED       # 비동기 작업 (기본 true)
ENABLE_DEBUG_LOGGING     # 디버그 로그 활성화
```

### 비밀 저장
- **방식**: `.env` 파일 (git ignored, 로컬만)
- **로드**: `dotenv` 패키지 (`api/src/admin-server.ts`)
- **주의**: .env 파일은 저장소에 커밋되지 않음 (`.gitignore` 확인 필수)

## 에셋 검색 & 인덱싱

### LLM용 에셋 제공
- **소스**: `assets-index.json` (경량 인덱스)
  - 프롬프트에 직접 내장
  - 카테고리, 태그 기반 필터링
  - 위치: `api/src/prompt-loader.ts`

### 에셋 매칭 알고리즘
- **주제 기반**: 요청 topic에서 토큰 추출
- **카테고리 필터**: subject별 SUBJECT_KEYWORDS 매칭
- **태그 검색**: 토픽 토큰과 에셋 태그 교집합
- **순위**: 매칭도 높은 순으로 상위 선택
- **제한**: Core 에셋 10개 + 8-bit 에셋 14개 최대

## 데이터 파이프라인

### 콘텐츠 생성 흐름
1. **요청**: POST `/api/generate-content` (GenerateContentRequest)
2. **검증**: validateGenerateContentRequest 호출
3. **모듈 ID 생성**: createModuleId (날짜 + topic slug)
4. **Job 생성**: 상태 pending으로 저장
5. **LLM 호출** (비동기):
   - 에셋 로드 (prompt-loader.ts)
   - 프롬프트 구성 (buildPrompt)
   - Z.ai API 스트림 호출
   - 응답 파싱 (parseZaiOutput)
6. **파일 저장**: edu-content/{moduleId}에 HTML/CSS/JS 저장
7. **Job 상태 업데이트**: completed 또는 failed
8. **WebSocket 브로드캐스트**: 클라이언트에 알림

### 콘텐츠 검토 흐름
1. **요청**: POST `/api/review-content` (ReviewContentRequest)
2. **모듈 존재 확인**: moduleExists 체크
3. **Job 생성**: 상태 pending으로 저장
4. **Review 실행** (비동기):
   - 모듈 파일 로드
   - LLM 검토 호출
   - 결과 파싱 (parseReviewOutput)
5. **자동 수정** (옵션): buildFixMessages로 수정 프롬프트 생성
6. **Job 상태 업데이트**: 리뷰 결과 저장
7. **WebSocket 브로드캐스트**: 검토 결과 전송

---

*외부 연동 분석: 2026-02-15*
