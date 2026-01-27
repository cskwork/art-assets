# 조사 노트: 콘텐츠 생성 지연 및 파싱 오류

## 관찰된 현상
- job 상태에서 `status: failed` 와 `error: "Z.ai 응답 JSON 파싱에 실패했습니다."` 확인
- 일부 job은 `processing` 상태에서 오래 머무르는 것으로 보임

## 초기 가설
- 생성 이후 리뷰/자동수정 루프가 직렬로 오래 걸릴 가능성
- Z.ai 응답이 순수 JSON이 아니라 코드펜스/설명 텍스트가 섞여 파싱 실패할 가능성
- job 저장(jobs.json) I/O가 과도하거나 동기 처리일 가능성

## 다음 확인 대상 파일
- api/src/content-generator.ts
- api/src/llm/zai-client.ts
- api/src/job-manager.ts
- api/src/index.ts

## 코드 기반 확인 결과 (1차)
- 파이프라인은 `생성 → 리뷰 → 자동수정(최대 3회) → 완료` 순서로 직렬 처리됨 (`api/src/content-generator.ts`).
- 리뷰/수정 단계의 프롬프트에 `index.html`, `script.js`, `style.css` 전체 내용이 그대로 포함되어 요청 크기가 매우 커질 수 있음 (`api/src/llm/review.ts`).
- job 저장은 `updateJob` 호출마다 `jobs.json`을 동기식으로 전체 덮어쓰기 함 (`api/src/job-manager.ts`).
- 실제 diff에서 `jobs.json`이 과거에 180줄 이상 + 대형 `review` 객체를 포함하고 있었고, 이 경우 동기 전체 쓰기가 반복되면 체감 지연을 유발할 수 있음.
- 파싱 실패 메시지는 `parseZaiFiles → JSON.parse`에서 발생하며, JSON 내부 문자열 이스케이프가 깨진 경우 발생 가능성이 큼 (`api/src/llm/zai-output.ts`).
- 현재 테스트(`npm test`)는 모두 통과함. 하지만 \"이스케이프가 깨진 JSON\" 케이스는 테스트에 없음.

## 추가 관찰
- 시스템 프롬프트(`api/system-prompt/system.md`) 길이는 약 17,695자이며, 리뷰/수정은 여기에 파일 3개 전체가 추가되어 요청 크기가 급격히 커질 수 있음.
- 실제 생성 결과(`edu-content/20260127-topic-5f41ee24/`)는 파일당 약 7~10KB 수준이지만, 리뷰/수정 요청에는 전체가 포함됨.
- `jobs.json` diff가 `-2,181 +2,29`인 점은 job 저장소가 과거에 매우 커졌음을 의미하며, 동기식 전체 쓰기 구조와 결합될 때 체감 지연 가능성이 높음.

## 구현 결과 (리뷰/자동수정 분리)
- 생성 응답에 리뷰 가이드 필드를 추가함: `reviewRecommended`, `reviewEndpoint`, `reviewStatusEndpoint` (`api/src/index.ts`).
- 리뷰 전용 API를 추가함: `createReviewContentJob`, `getReviewContentStatus` (`api/src/index.ts`), 라우터 연결은 `server.js`.
- 리뷰/자동수정 기본값을 비활성화함 (`api/src/content-generator.ts`).
- 리뷰 흐름을 `performReviewFlow`로 분리하고, 리뷰 전용 실행 함수 `reviewContentForJob`를 추가함 (`api/src/content-generator.ts`).
- job에 `jobType`을 도입하고, `createReviewJob`, `findGenerateJobByModuleId`, 타입 필터 조회를 추가함 (`api/src/job-manager.ts`).
- 외부 API 호출을 막기 위한 테스트용 플래그 `ASYNC_JOBS_ENABLED=false`를 도입함 (`api/src/index.ts`).
- TDD: `tests/api-review-api.test.js` 추가 후 실패 확인 → 구현 → `npm --prefix api run build` 및 `npm test` 통과 확인.
