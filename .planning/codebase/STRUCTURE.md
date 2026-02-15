# 코드베이스 구조

**분석 날짜:** 2026-02-15

## 디렉토리 레이아웃

```
art-assets/
├── .claude/                    # GSD 및 스킬 설정
├── .context/                   # 프로젝트 컨텍스트 (계획, 노트)
├── .omc/                       # GSD 상태 추적
├── .planning/                  # 분석 문서 (이 파일들)
├── .vscode/                    # VSCode 설정
├── 3d/                         # 3D 모델 스크립트 (생성용)
├── 8bit-assets/                # 픽셀 아트 에셋 팩 (외부 소스)
├── admin-ui/                   # Admin 대시보드 UI
├── api/                        # TypeScript API 서버 (콘텐츠 생성/리뷰)
│   ├── src/                    # TypeScript 소스
│   ├── dist/                   # 컴파일된 JavaScript
│   ├── data/                   # 작업 저장소 (JSON)
│   ├── system-prompt/          # LLM 시스템 프롬프트
│   ├── test-zai.js             # Z.ai 클라이언트 테스트
│   └── tsconfig.json           # TypeScript 설정
├── archive/                    # 아카이브된 에셋 (카테고리별 하위폴더)
│   ├── icons/
│   ├── diagrams/
│   └── ...
├── backgrounds/                # 배경 이미지 (JPG/PNG)
├── diagrams/                   # 다이어그램, 차트 (SVG/PNG)
├── docs/                       # 프로젝트 문서 (변경 기록, 계획)
├── edu-content/                # 교육용 인터랙티브 모듈
│   ├── 20260126-box-volume/    # 예: 직육면체 부피 (초등 6학년)
│   ├── 20260127-pythagorean-3d/ # 예: 피타고라스 정리 (중2)
│   └── ...
├── icons/                      # SVG 아이콘
├── illustrations/              # SVG/PNG 일러스트레이션
├── photos/                     # JPG 사진
├── prompts/                    # LLM 프롬프트 템플릿 (과목별)
├── scripts/                    # 유틸리티 스크립트 (빌드, 아카이브)
├── tests/                      # 자동화 테스트
├── assets.json                 # 빌드 산출물: full 형식 에셋 목록
├── assets-index.json           # 빌드 산출물: LLM 검색용 경량 인덱스
├── assets-source.json          # 에셋 소스 (compact 형식, 편집용)
├── build-gallery.js            # 에셋 빌드 + 갤러리 HTML 생성
├── gallery.html                # 빌드 산출물: 에셋 갤러리 UI
├── server.js                   # 정적 파일 서빙 + Archive API
├── CLAUDE.md                   # LLM 지침 (한국어)
├── package.json                # 프로젝트 메타데이터 + 스크립트
├── package-lock.json
├── start.sh / start.bat         # 시작 스크립트
└── .env (not in repo)          # 환경 변수 (Z.ai API 키 등)
```

## 디렉토리 목적

**에셋 저장소 (최상위 카테고리 폴더):**
- `icons/`: SVG 아이콘 (체크마크, 버튼, 심볼 등)
- `illustrations/`: SVG/PNG 일러스트레이션 (캐릭터, 배경 요소)
- `diagrams/`: SVG/PNG 다이어그램 (수학 그래프, 과학 다이어그램)
- `backgrounds/`: PNG/JPG 배경 이미지
- `photos/`: JPG 사진
- `3d/`: GLB/GLTF 3D 모델, 생성 스크립트

**API 서버:**
- `api/src/`: TypeScript 소스 (구조 아래 참조)
- `api/dist/`: 컴파일된 JavaScript (실행 파일)
- `api/data/`: JSON 저장소 (작업 상태, 배치)
  - `jobs.json`: 진행 중 및 완료된 작업
  - `batches.json`: 배치 처리 상태
- `api/system-prompt/`: LLM 시스템 프롬프트 (system.md)

**교육 콘텐츠:**
- `edu-content/{YYYYMMDD}-{topic}/`: 각 모듈 디렉토리
  - `index.html`: 7씬 인터랙티브 콘텐츠 (Hook/Anchor/Story/Core/Visualize/Quiz/Wrap)
  - `script.js`: 씬 네비게이션, 인터랙션 로직, ContentApp 싱글톤
  - `style.css`: 반응형 스타일, 애니메이션

**빌드 산출물:**
- `gallery.html`: 에셋 갤러리 (브라우저에서 열 수 있음)
  - 다이나믹 UI: 카테고리 탐색, 검색, Archive/Restore 버튼
  - 정보: 에셋 메타데이터, 아카이브 상태
- `assets.json`: full 형식 에셋 목록 (gallery.html에서 읽음)
- `assets-index.json`: compact 형식 인덱스 (LLM 검색용)

**빌드 및 배포:**
- `scripts/`: CLI 도구
  - `build-assets.js`: assets-source.json → assets.json + assets-index.json
  - `archive.js`: 에셋 아카이브/복원
  - `backfill-jobs.js`: 작업 데이터 마이그레이션
  - `import-8bit-assets.js`: 외부 에셋 팩 임포트
- `build-gallery.js`: 전체 빌드 오케스트레이션
- `server.js`: Node.js HTTP 서버 (갤러리 + API)

**문서:**
- `docs/changelog/`: 버전별 변경 기록
- `docs/plans/`: 프로젝트 계획 문서
- `.context/`: 프로젝트 컨텍스트 및 노트
- `.planning/codebase/`: 이 문서들

**개발:**
- `tests/`: Jest 테스트 (API 유효성, 콘텐츠 품질 검증 등)
- `prompts/`: LLM 프롬프트 템플릿 (과목별)
  - `math.md`: 수학 콘텐츠 프롬프트
  - `english.md`: 영어 콘텐츠 프롬프트
  - `science.md`: 과학 콘텐츠 프롬프트 등
- `.vscode/`: VSCode 설정 (포맷, 린트)

## 주요 파일 위치

**진입점:**
- `server.js`: 갤러리 서빙 시작점 (node server.js)
- `api/dist/admin-server.ts` (컴파일 후 JS): API 서버 시작점
- `build-gallery.js`: 빌드 시작점
- `package.json`: npm 스크립트 정의

**설정:**
- `assets-source.json`: 에셋 메타데이터 소스 (편집 파일)
- `.env`: 환경 변수 (Z.ai API 키, 포트 등) - .gitignore에 포함
- `api/tsconfig.json`: TypeScript 컴파일 설정
- `package.json`: 의존성, 스크립트

**핵심 로직:**
- `api/src/index.ts`: 콘텐츠 생성/리뷰 엔드포인트
- `api/src/admin-server.ts`: Express 서버, 라우팅
- `api/src/content-generator.ts`: 모듈 생성 로직
- `api/src/job-manager.ts`: 작업 라이프사이클
- `api/src/llm/zai-client.ts`: Z.ai API 클라이언트

**테스트:**
- `tests/api-*.test.js`: API 유효성 검증
- `tests/api-zai-*.test.js`: Z.ai 클라이언트 테스트
- `tests/edu-*.test.js`: 콘텐츠 구조/품질 검증

## 명명 규칙

**에셋 파일:**
- 형식: `{category}-{description}-{variant}-{YYYYMMDD}.{ext}`
- 예: `icon-checkmark-green-20260124.svg`, `diagram-pythagorean-20260127.svg`
- 규칙: kebab-case, 날짜 필수 (YYYYMMDD), 공백/특수문자 금지

**에셋 ID (assets-source.json):**
- 파일명과 동일 (확장자 제외)
- 예: `icon-checkmark-green-20260124`
- 경로: 자동 생성 `{category}/{id}.{format}`

**edu-content 모듈:**
- 형식: `{YYYYMMDD}-{topic-slug}`
- 예: `20260126-box-volume`, `20260127-pythagorean-3d`
- 파일: 각 모듈 내에 `index.html`, `script.js`, `style.css` (고정)

**API 파일 (api/src/):**
- 파스칼 케이스 모듈: `AdminServer.ts`, `ContentGenerator.ts`
- 케밥 케이스 유틸: `job-manager.ts`, `zai-client.ts`
- 타입 파일: `types.ts`
- 서브디렉토리: `llm/` (LLM 관련)

**빌드 및 스크립트:**
- 케밥 케이스: `build-gallery.js`, `build-assets.js`, `archive.js`
- 실행 권한: `+x` (Unix/Linux)

**API 엔드포인트:**
- RESTful: `/api/{resource}/{action}`
- 예: `/api/generate-content`, `/api/generate-content/status/{jobId}`, `/api/review-content`

## 새로운 코드를 추가할 위치

**새로운 에셋 추가:**
1. 파일 생성: `{category}/{id}-{YYYYMMDD}.{ext}`
2. `assets-source.json`의 `assets` 배열에 추가: `[id, category, tags[], description]`
3. 빌드: `node build-gallery.js`

**새로운 교육 모듈 추가:**
1. 디렉토리 생성: `edu-content/{YYYYMMDD}-{topic-slug}/`
2. 파일 생성:
   - `index.html`: 7씬 구조 (Hook/Anchor/Story/Core/Visualize/Quiz/Wrap)
   - `script.js`: ContentApp 싱글톤, 씬 로직
   - `style.css`: 반응형 스타일
3. 에셋 참조: 상대 경로 (예: `../../icons/icon-name.svg`)
4. 서버에서 접속: `http://localhost:3000/edu-content/{YYYYMMDD}-{topic-slug}/`

**새로운 API 엔드포인트:**
1. `api/src/index.ts`에 함수 추가: `export async function createXxxJob(...)`
2. `api/src/types.ts`에 요청/응답 타입 추가
3. `api/src/admin-server.ts`에 라우트 추가: `app.post('/api/xxx', ...)`
4. 선택: WebSocket 통합 (admin-server.ts의 `wss()` 핸들러)

**새로운 LLM 프롬프트:**
1. 파일 생성: `prompts/{subject}.md`
2. 형식: 마크다운 (섹션: System/User/Expected Output)
3. 로드: `api/src/prompt-loader.ts`의 `loadPrompt(subject)`
4. 사용: `content-generator.ts`에서 Z.ai 호출 시

**새로운 테스트:**
1. 파일 생성: `tests/{module}.test.js`
2. Node.js 테스트 러너: `node --test` (package.json의 "test" 스크립트)
3. 실행: `npm test`

## 특수 디렉토리

**archive/:**
- 목적: 아카이브된 에셋 저장소
- 생성: 자동 (archive.js에서 카테고리별 하위폴더 생성)
- 파일명: 원본과 동일 `{category}/{id}.{format}`
- 커밋 여부: 선택사항 (에셋 파일만, 메타데이터는 assets-source.json)

**api/data/:**
- 목적: 작업 상태 저장소
- 파일: `jobs.json`, `batches.json`
- 생성: 자동 (admin-server.ts 시작 시)
- 커밋 여부: 선택사항 (로컬 개발 상태)

**api/dist/:**
- 목적: TypeScript 컴파일 산출물
- 생성: `npm run build` (api 디렉토리에서 tsc)
- 커밋 여부: NO (생성 가능)
- 실행: `node api/dist/admin-server.js`

**8bit-assets/:**
- 목적: 외부 픽셀 아트 팩 저장소
- 생성: import-8bit-assets.js로 임포트
- 구조: 원본 유지 (수정 없음)

**.claude/skills/:**
- 목적: GSD 스킬 정의 (LLM용)
- 파일: `{skill-name}/SKILL.md`, `references/`
- 예: `art-asset-search/`, `Phaser/`

**.context/ & .planning/:**
- 목적: 프로젝트 분석 및 계획
- 파일: Markdown 문서
- 관리: 사용자/LLM에 의해 작성

---

*구조 분석: 2026-02-15*
