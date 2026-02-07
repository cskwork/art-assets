# Phase 05: 무한 생성 루프 + 아트 에셋 통합 + 과학 콘텐츠 지원

이 Phase에서는 무한 콘텐츠 생성 루프 모드를 구현하고, 아트 에셋 자동 활용 시스템을 완성하며, 과학 과목 콘텐츠 생성을 파이프라인에 통합한다. Admin UI에서 "무한 루프" 모드를 활성화하면 시스템이 자동으로 트렌딩 주제를 수집하고, 에셋을 선택하고, 콘텐츠를 생성하고, 테스트하는 과정을 중단 없이 반복한다.

## Tasks

- [ ] 무한 생성 루프 엔진 구현 (`api/src/agents/loop-engine.ts`):
  - `api/src/agents/pipeline.ts`를 읽어서 파이프라인 구조를 확인한다
  - `api/src/agents/batch-manager.ts`를 읽어서 배치 관리 구조를 확인한다
  - `LoopEngine` 클래스 생성:
    - `start(config: LoopConfig)`: 무한 루프 시작
      - `LoopConfig`: `{ subjects[], contentTypes[], gradeLevels[], useArtAssets, pauseBetween, maxConcurrent }`
      - 루프 사이클:
        1. TrendResearcher로 다음 주제 선정
        2. CurriculumDB에서 매칭 확인
        3. 중복 체크: 이미 생성된 동일 주제/학년 조합 스킵
        4. ContentPipeline으로 생성 -> 리뷰 -> 테스트
        5. 결과 기록 후 다음 사이클
      - 동시 실행: `maxConcurrent` 개 (기본 1, 최대 3)만큼 파이프라인 병렬 실행
      - `pauseBetween`: 각 사이클 사이 대기 시간 (초, 기본 10)
    - `stop()`: 루프 중지 (현재 진행 중인 작업은 완료 후 중지)
    - `pause()` / `resume()`: 일시정지 / 재개
    - `getStatus()`: 현재 루프 상태 반환 (running/paused/stopped, 생성 횟수, 성공/실패 수)
    - 중복 체크 데이터: `api/data/generated-history.json`에 생성 이력 저장
  - `api/src/types.ts`에 `LoopConfig`, `LoopStatus` 타입 추가

- [ ] 아트 에셋 자동 활용 시스템 (`api/src/agents/asset-selector.ts`):
  - `assets-index.json`을 읽어서 에셋 인덱스 구조를 확인한다
  - `AssetSelector` 클래스 생성:
    - `selectAssets(subject, topic, contentType)`: 주제에 맞는 에셋 자동 선택
      - `assets-index.json` 로드 후 태그 기반 매칭
      - 과목별 기본 에셋 매핑:
        - 수학: geometry, number, graph 태그 에셋
        - 영어: character, speech, game 태그 에셋
        - 과학: molecule, atom, plant, circuit 태그 에셋
      - 콘텐츠 유형별 에셋 필터:
        - Phaser: 2D 에셋만 (icons, illustrations)
        - Three.js: 3D 에셋 우선 + 2D 보조
      - 반환: 선택된 에셋 목록 `{ id, path, description }[]`
    - `buildAssetPromptSection(assets[])`: 선택된 에셋을 프롬프트 삽입 형식으로 변환
      - "사용 가능한 아트 에셋:" 섹션으로 에셋 경로와 설명 나열
      - 에셋 활용 가이드라인 추가 (상대 경로 사용법 등)
  - `api/src/agents/prompt-builder.ts` 수정: AssetSelector 결과를 프롬프트에 통합

- [ ] Admin UI에 무한 루프 모드 및 에셋 선택 UI 추가:
  - `admin-ui/index.html`과 `admin-ui/app.js`를 읽고 현재 UI를 확인한다
  - 사이드바에 "무한 루프" 토글 스위치 추가:
    - 활성화 시: 과목/유형/학년 다중 선택 가능
    - 동시 실행 수 슬라이더 (1-3)
    - 사이클 간 대기 시간 입력 (초)
    - "루프 시작" / "일시정지" / "중지" 버튼
  - 에셋 선택 패널 추가:
    - 아트 에셋 활용 토글 (ON/OFF)
    - ON일 때: 에셋 카테고리 필터 (icons, illustrations, 3d 등)
    - 에셋 미리보기 그리드 (축소판)
    - "자동 선택" 체크박스 (주제에 맞게 자동 매칭)
  - 대시보드 메인 영역에 루프 상태 패널:
    - 총 생성 수 / 성공 수 / 실패 수 카운터
    - 현재 루프 상태 표시 (running/paused/stopped)
    - 생성 이력 타임라인 (최근 20개)
  - `admin-server.ts`에 루프 API 엔드포인트 추가:
    - `POST /api/admin/loop/start` -> LoopEngine.start()
    - `POST /api/admin/loop/stop` -> LoopEngine.stop()
    - `POST /api/admin/loop/pause` -> LoopEngine.pause()
    - `POST /api/admin/loop/resume` -> LoopEngine.resume()
    - `GET /api/admin/loop/status` -> LoopEngine.getStatus()

- [ ] 과학 과목 콘텐츠 생성 통합:
  - `prompts/science.md`를 읽어서 과학 프롬프트 구조를 확인한다
  - `api/src/agents/prompt-builder.ts` 수정:
    - 과학 과목 프롬프트 빌드 로직 추가
    - 과학 + Phaser 조합: 실험 시뮬레이션 게임 (물리/화학 상호작용)
    - 과학 + Three.js 조합: 3D 분자/천체/회로 시각화
  - `api/src/agents/reviewer-agent.ts` 수정: 과학 콘텐츠 전용 검증 규칙 추가
    - 과학적 정확성 체크 포인트 (프롬프트에 포함)
    - 실험 안전 경고 표시 확인
  - `api/src/agents/tester-agent.ts` 수정: 과학 콘텐츠 테스트 시나리오 추가
    - 시뮬레이션 캔버스 렌더링 확인
    - 입자/분자 애니메이션 동작 확인

- [ ] 무한 루프 통합 테스트 작성:
  - `tests/loop-engine.test.js` 생성:
    - 루프 시작/중지 테스트: start() 호출 후 stop() 호출 시 정상 종료
    - 중복 체크 테스트: 동일 주제/학년 조합 스킵 확인
    - 동시 실행 제한 테스트: maxConcurrent 초과 시 대기
  - `tests/asset-selector.test.js` 생성:
    - 태그 매칭 테스트: math + geometry 에셋 반환
    - 콘텐츠 유형 필터 테스트: Phaser는 2D만, Three.js는 3D 우선
    - 프롬프트 삽입 테스트: buildAssetPromptSection 출력 형식 확인

- [ ] 빌드 및 전체 통합 검증:
  - `cd api && npm run build` 컴파일 확인 및 에러 수정
  - `npm test` 전체 테스트 실행 및 실패 수정
  - 서버 시작 후 Admin UI에서 무한 루프 모드 UI 확인
  - 루프 시작/정지 API 호출 테스트
  - 에셋 선택 API 테스트: `/api/admin/assets` 응답 확인
  - `docs/changelog/changelog-2026-02-07.md`에 무한 루프 + 에셋 통합 내역 추가
