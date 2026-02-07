# Phase 02: Agent Team Pipeline + Claude Agent SDK 통합

이 Phase에서는 Claude Agent SDK를 활용한 Agent Team 파이프라인을 구축한다. 각 콘텐츠 생성 요청은 독립된 Agent context에서 실행되며, 생성 -> 리뷰 -> 수정 루프를 거친다. 기존 `content-generator.ts`의 Claude Agent SDK 통합을 확장하여 Team 기반 워크플로를 구현하고, Phaser/Three.js 콘텐츠 유형에 따라 적절한 프롬프트를 자동 선택하는 시스템을 완성한다.

## Tasks

- [ ] Agent Team 아키텍처 설계 및 파이프라인 모듈 생성 (`api/src/agents/`):
  - 기존 `api/src/content-generator.ts`를 읽어서 Claude Agent SDK `query()` 호출 패턴을 파악한다
  - 기존 `api/src/llm/review.ts`를 읽어서 리뷰 워크플로를 파악한다
  - `api/src/agents/` 디렉토리 생성
  - `api/src/agents/pipeline.ts` 생성: 콘텐츠 생성 파이프라인 오케스트레이터
    - `ContentPipeline` 클래스: 단일 콘텐츠의 전체 라이프사이클 관리
    - 단계: `research -> generate -> review -> fix -> finalize`
    - 각 단계는 독립된 Claude Agent SDK `query()` 호출 (별도 context)
    - 이벤트 에미터 패턴으로 진행 상태를 WebSocket에 전달
    - 최대 재시도 횟수: 3회 (리뷰 실패 시 자동 수정)
  - `api/src/agents/generator-agent.ts` 생성: 콘텐츠 생성 전담 Agent
    - 기존 `content-generator.ts`의 `generateContent()` 로직을 리팩토링하여 재사용
    - Phaser/Three.js 콘텐츠 유형에 따라 프롬프트 자동 선택:
      - Phaser: `prompts/math.md` 또는 `prompts/english.md` + Phaser 3 가이드라인 주입
      - Three.js: `prompts/3d-content.md` 합성 또는 과목별 프롬프트 + Three.js 가이드라인
    - 아트 에셋 사용 옵션: `assets-index.json`에서 관련 에셋을 검색하여 프롬프트에 포함
    - 출력: `edu-content/{moduleId}/` 경로에 index.html, script.js, style.css 생성
  - `api/src/agents/reviewer-agent.ts` 생성: 콘텐츠 리뷰 전담 Agent
    - 기존 `api/src/llm/review.ts`의 deterministic + LLM 리뷰를 활용
    - 추가 검증: 콘텐츠 유형별 체크 (Phaser: Phaser.Game 인스턴스 존재, Three.js: THREE.Scene 존재)
    - 교육적 적합성 리뷰: 7씬 구조 준수, 한국어 설명, 학년 수준 적절성
    - 출력: `ReviewResult` (pass/fail, score, issues[])

- [ ] 프롬프트 합성 시스템 (`api/src/agents/prompt-builder.ts`):
  - `prompts/` 폴더의 모든 프롬프트 파일을 읽는다
  - `api/system-prompt/system.md`를 읽는다
  - `PromptBuilder` 클래스 생성:
    - `buildGenerationPrompt(subject, contentType, gradeLevel, topic, artAssets?)`: 최종 프롬프트 조합
    - 기본 시스템 프롬프트 (system.md) + 과목별 프롬프트 (math/english/science.md) 합성
    - 콘텐츠 유형 오버레이:
      - Phaser: Phaser 3 CDN, 아케이드 물리, 드래그앤드롭, 점수 시스템 가이드라인 추가
      - Three.js: Three.js r128/r160, OrbitControls, GLTFLoader, 카메라 애니메이션 가이드라인 추가 (3d-content.md 활용)
    - 아트 에셋 주입: `assets-index.json`에서 관련 에셋을 검색하여 "사용 가능한 에셋" 섹션으로 프롬프트에 추가
    - 학년별 컨텍스트 조정: 초등(쉬운 언어, 큰 UI) vs 중등(심화 개념, 세밀 인터랙션)
  - `buildReviewPrompt(moduleId, files, contentType)`: 리뷰 프롬프트 조합
  - `buildFixPrompt(moduleId, files, issues[])`: 자동 수정 프롬프트 조합

- [ ] 기존 content-generator.ts와 batch-manager.ts를 Agent Pipeline으로 연결:
  - `api/src/batch-manager.ts`를 읽고 Phase 01에서 생성한 구조를 확인한다
  - `batch-manager.ts` 수정: 각 Job 실행 시 `ContentPipeline` 인스턴스를 생성하여 파이프라인 실행
  - `admin-server.ts` 수정: WebSocket 브로드캐스트에 파이프라인 이벤트 연결
    - 단계 전환 이벤트: `{ type: 'stage_change', jobId, stage: 'generate'|'review'|'fix'|'complete' }`
    - 로그 이벤트: `{ type: 'log', jobId, message, timestamp }`
    - 완료 이벤트: `{ type: 'job_complete', jobId, moduleId, success, score }`
  - `content-generator.ts`는 직접 수정하지 않고, generator-agent.ts에서 핵심 함수만 import하여 재사용

- [ ] Agent Team 파이프라인 테스트 작성:
  - `tests/agent-pipeline.test.js` 생성:
    - PromptBuilder 단위 테스트: 각 과목/콘텐츠 유형 조합에 대해 올바른 프롬프트 합성 확인
    - Pipeline 단계 전환 테스트: research -> generate -> review -> fix 순서 검증
    - BatchManager 통합 테스트: 수량 3 요청 시 3개 Job 생성 확인
    - 에러 처리 테스트: 생성 실패 시 Job 상태가 'failed'로 업데이트되는지 확인
  - `tests/prompt-builder.test.js` 생성:
    - math + phaser 조합 프롬프트에 Phaser CDN URL이 포함되는지
    - science + threejs 조합 프롬프트에 Three.js OrbitControls가 포함되는지
    - 아트 에셋 주입 시 에셋 경로가 프롬프트에 올바르게 포함되는지

- [ ] 테스트 실행 및 컴파일 검증:
  - `cd api && npm run build` 실행하여 새로운 agents/ 모듈 컴파일 확인
  - 컴파일 에러 수정
  - `npm test` 실행하여 기존 테스트 + 새 테스트 모두 통과 확인
  - 실패한 테스트 수정
  - `docs/changelog/changelog-2026-02-07.md`에 Agent Pipeline 구현 내역 추가
