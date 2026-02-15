# 기술 스택

**분석 날짜:** 2026-02-15

## 언어

**주요:**
- JavaScript - 빌드 스크립트, 갤러리 생성 로직, 에셋 관리
- TypeScript 5.6.3 - API 서버 코드, 타입 안전성 강화
- HTML5 - 교육 콘텐츠 UI, 갤러리 페이지
- CSS3 - 반응형 스타일링, 애니메이션, 3D Transform
- GLSL - Three.js 셰이더 (3D 콘텐츠)

**위치:**
- TypeScript: `api/src/` 디렉토리
- JavaScript: 루트 레벨 빌드 스크립트 (`build-gallery.js`, `scripts/`)
- 교육 콘텐츠: `edu-content/{module-name}/` 내 순수 HTML/CSS/JS

## 런타임

**환경:**
- Node.js (버전 명시 없음, 현대적 ES2020+ 지원 필요)
- 브라우저 환경 (최신 Chromium, Firefox, Safari)

**패키지 매니저:**
- npm 8+ (package.json, package-lock.json 사용)
- 루트 레벨과 API 레벨 별도의 package.json 구조

## 프레임워크 & 라이브러리

**API 서버:**
- Express.js 4.22.1 - HTTP 서버, 라우팅
- express-ws 5.0.2 - WebSocket 통신 (실시간 작업 상태 업데이트)
- CORS 2.8.6 - Cross-origin 요청 처리

**LLM 연동:**
- @anthropic-ai/claude-agent-sdk 0.2.19 - Claude API 통합 (선택 가능)
- 내부 Z.ai 클라이언트 (`api/src/llm/zai-client.ts`) - GLM API 직접 호출

**3D 그래픽:**
- Three.js 0.182.0 - 3D 콘텐츠 (피타고라스 정리, 회전체, 위치 전치사)
  - 로더: GLTFLoader, OrbitControls (CDN 로딩)

**2D 게임:**
- Phaser 3.80.1 - 게임 프레임워크 (구구단 레이싱, 좌표 탐험대, 동작 동사)
  - CDN 로딩 (`https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js`)

**Canvas & 그래픽:**
- Canvas API 2D Context - 월드 퀴즈 배틀 전투 애니메이션
- Web Audio API - 사운드 매니저 (BGM, SFX)
- Web Speech API - 영어 발음 학습

**수식 렌더링:**
- MathJax 3 - 수학 공식 인라인 렌더링 (CDN)

**유틸리티:**
- dotenv 17.2.3 / 16.4.5 - 환경 변수 관리
- @gltf-transform/core 4.3.0 - glTF 모델 변환 유틸
- @gltf-transform/extensions 4.3.0 - glTF 확장 지원

**개발 도구:**
- TypeScript 5.6.3 - 타입 체킹, 트랜스파일
- concurrently 9.2.1 - 병렬 실행 (API 빌드 + 서버 시작)

## 빌드 & 개발

**TypeScript 설정:**
- 컴파일 대상: ES2020
- 모듈 형식: CommonJS
- 소스: `api/src/**/*.ts`
- 출력: `api/dist/**/*.js`
- 설정 파일: `api/tsconfig.json`

**빌드 명령:**
```bash
npm run build              # API TypeScript 빌드 + 갤러리 생성
npm run build:watch       # TypeScript 감시 모드
npm run dev              # API 빌드 감시 + 서버 실행 (병렬)
npm run start            # 프로덕션 서버 시작
```

**npm 스크립트:**
- `dev`: `concurrently -n tsc,srv "npm run build:watch --prefix api" "node api/dist/admin-server.js"`
- `build`: `cd api && npm run build && cd .. && node build-gallery.js`
- `start`: `node api/dist/admin-server.js`
- `test`: `node --test` (테스트 러너)
- `backfill:jobs`: 작업 데이터 백필
- `import:8bit`: 픽셀아트 에셋 임포트

## 핵심 의존성

**매우 중요:**
- Express.js - API 서버의 핵심, 모든 엔드포인트 지원
- Z.ai API (내부 구현) - 한국 LLM (GLM-4.7, GLM-5) 기반 교육 콘텐츠 생성
- Three.js - 3D 시각화 (학습 효과 극대화)
- TypeScript - 타입 안전성으로 버그 방지

**인프라 관련:**
- dotenv - 환경 설정 관리 (API 키, 포트, 경로)
- express-ws - 실시간 작업 상태 브로드캐스트
- CORS - 외부 도메인에서 API 접근 허용

## 설정

**환경 변수:**
```
# LLM 선택 (기본값: zai)
LLM_PROVIDER=zai|claude

# Z.ai API (GLM 호출)
ZAI_API_KEY=sk-...  # 필수 (Z.ai)
ZAI_API_URL=https://api.z.ai/api/paas/v4/chat/completions  # 기본값

# Claude API (선택 가능)
ANTHROPIC_API_KEY=sk-ant-...  # 선택 (Claude 사용 시)

# 서버 설정
ADMIN_PORT=3000            # 관리 서버 포트
PORT=3000                  # 폴백 포트
PROJECT_ROOT=.             # 프로젝트 루트 경로
WS_ENABLED=true           # WebSocket 활성화

# 작업 관리
JOB_STORE_PATH=api/data/jobs.json  # 작업 상태 저장 위치
JOB_TTL_MS=604800000      # 작업 만료 시간 (기본 7일)
ASYNC_JOBS_ENABLED=true   # 비동기 작업 실행

# 로깅
ENABLE_DEBUG_LOGGING=false  # 디버그 로그 활성화
```

**.env 파일 위치:**
- 루트: `/d/PARA/Resource/art-assets/.env` (존재하지 않음, git ignored)
- 참조 파일: `/d/PARA/Resource/art-assets/.env.example` (스키마)

## 프로젝트 구조

**주요 디렉토리:**
- `api/` - Node.js API 서버 (TypeScript)
  - `src/` - TypeScript 소스
  - `dist/` - 컴파일된 JavaScript
  - `data/` - JSON 기반 작업 저장소 (jobs.json, batches.json)
- `scripts/` - 빌드 및 관리 유틸
  - `build-assets.js` - assets-source.json 처리
  - `archive.js` - 에셋 아카이브/복원
  - `import-8bit-assets.js` - 픽셀아트 에셋 임포트
- `edu-content/` - 교육용 인터랙티브 모듈
  - 각 모듈: `{YYYYMMDD}-{topic}/` (index.html, script.js, style.css)
- `icons/`, `illustrations/`, `diagrams/`, `backgrounds/`, `photos/`, `3d/` - 에셋 저장소
- `archive/` - 아카이브된 에셋 (카테고리별 하위 폴더)

## 플랫폼 요구 사항

**개발:**
- Node.js 18+ (async/await, Promise.all, fetch 지원)
- npm 8+
- 텍스트 에디터 또는 IDE (VS Code 권장)
- 터미널/쉘 (PowerShell, bash, zsh)

**프로덕션:**
- Node.js 18+ (서버 호스팅)
- HTTP/HTTPS 포트 접근성
- 디스크 공간 (에셋 + 생성된 콘텐츠 저장)
- 인터넷 연결 (Z.ai/Claude API 호출)

## 데이터 저장소

**파일 기반:**
- `api/data/jobs.json` - 작업 상태 저장 (in-memory 캐시 + 지속성)
- `api/data/batches.json` - 배치 생성 상태
- `assets-source.json` - 에셋 메타데이터 (compact 형식)
- `assets.json` - 빌드 산출물 (호환 형식)
- `assets-index.json` - LLM용 경량 인덱스

**메모리:**
- Job 맵 in-memory (시작 시 disk에서 로드)
- 웹소켓 연결 관리 (express-ws)

## 버전 관리

**현재 버전:**
- art-assets: 1.0.0
- edu-content-api: 1.0.0

**라이센스:**
- ISC

---

*기술 스택 분석: 2026-02-15*
