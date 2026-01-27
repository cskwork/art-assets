# Changelog - 2026-01-27

## 과학 콘텐츠 이모지 제거 및 SVG 아이콘 적용

### 추가
- `tests/science-no-emoji.test.js`: `content/science` 경로의 이모지 사용을 금지하는 회귀 테스트 추가
- `content/science/2026-01-27/science-icons.js`: 과학 모듈 공통 SVG 아이콘 레지스트리 및 data-attribute 하이드레이션 유틸 추가
- `icons/`: 과학 콘텐츠 이모지 대체용 SVG 아이콘 18종 추가 (축하, 자동차, 로켓, 태양, 새싹, 물방울, 이산화탄소, 포도당, 산소, 나무, 지구, 산맥, 화산, 충돌, 경고, 초승달, 보름달, 라면)

### 수정
- `content/science/2026-01-27/*/index.html`: 이모지 텍스트를 data-icon 기반 SVG 아이콘으로 전면 교체
- `content/science/2026-01-27/*/style.css`: SVG 아이콘 크기 및 정렬을 위한 공통 클래스와 컴포넌트별 스타일 보강
- `content/science/2026-01-27/*/script.js`: 퀴즈 피드백 및 동적 아이콘을 `ScienceIcons.setIcon` 기반으로 교체
- `assets.json`: 신규 SVG 아이콘 18종 메타데이터 추가

### 검증
- `npm test`: 과학 콘텐츠 이모지 금지 테스트 포함 전체 통과 확인

## 생성/리뷰 API 분리 및 리뷰 옵션화

### 추가
- `tests/api-review-api.test.js`: 생성 응답 가이드와 리뷰 전용 API에 대한 회귀 테스트 추가
- `api/src/index.ts`: 리뷰 전용 API(`createReviewContentJob`, `getReviewContentStatus`)와 생성 응답 리뷰 가이드 필드 추가
- `server.js`: `/api/review-content`, `/api/review-content/status/:jobId` 라우팅 추가

### 수정
- `api/src/content-generator.ts`: 리뷰/자동수정 기본값 비활성화 및 리뷰 전용 실행 함수(`reviewContentForJob`) 추가
- `api/src/job-manager.ts`: `jobType` 도입, 리뷰 잡 생성(`createReviewJob`), 모듈 기준 생성 잡 조회(`findGenerateJobByModuleId`) 추가
- `api/src/types.ts`: 리뷰 요청/응답 타입, `jobType`, `MODULE_NOT_FOUND` 에러 코드 추가

### 검증
- `npm --prefix api run build`: TypeScript 빌드 통과
- `npm test`: 전체 테스트(22개) 통과
