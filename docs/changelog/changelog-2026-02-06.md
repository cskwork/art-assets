# Changelog - 2026-02-06

## Phaser 기반 수학 3D 콘텐츠 프롬프트 정비

### 추가
- `docs/changelog/changelog-2026-02-06.md`: 금일 변경 이력 문서 신규 작성
- `.do-work/user-requests/UR-001/input.md`: 사용자 원문 요청 캡처
- `.do-work/REQ-001-phaser-math-3d-content.md`: 요청 관리용 REQ 문서 추가

### 수정
- `prompts/3d-content.md`: Three.js 중심 구조를 Phaser 기반 수학 콘텐츠 프롬프트로 전면 개편
  - 7개 장면 구조 유지
  - Phaser 의사 3D(2.5D) 원칙 및 한계 명시
  - 수학 템플릿, 기술 규격, 품질/보안 체크리스트 반영

### 검증
- `npm test`: 저장소 기본 테스트 실행으로 회귀 여부 확인

## Phaser 수학 콘텐츠 생성 실행 (피타고라스 정리)

### 추가
- `edu-content/20260206-phaser/index.html`: 7개 장면 오버레이와 Phaser 캔버스 결합 구조 추가
- `edu-content/20260206-phaser/script.js`: Phaser 기반 직각삼각형/정사각형 시각화 및 코어/퀴즈 상호작용 구현
- `edu-content/20260206-phaser/style.css`: 모바일 대응 포함 UI 스타일 추가
- `edu-content/20260206-phaser/CLAUDE.md`: 학습 목표/선수·후속 개념/평가 포인트 문서 추가
- `tests/phaser-pythagorean-content.test.js`: 신규 모듈 구조 및 필수 장면 검증 테스트 추가

### 참고
- API 기반 자동 생성 시도 중 네트워크 호출 오류(`fetch failed`)로 실패하여, 동일 모듈을 로컬 구현으로 대체

### 검증
- `npm test`: 전체 테스트(23개) 통과
- `npm --prefix api run build`: TypeScript 빌드 통과

## Phaser 피타고라스 모듈 UI/설명 강화

### 수정
- `edu-content/20260206-phaser/index.html`: 장면별 상세 설명(리스트/설명 박스/태그) 추가, 퀴즈 설명/점수/보강 문구 확장
- `edu-content/20260206-phaser/style.css`: 배경 오브/그리드 레이어, 패널 애니메이션, 버튼 호버 효과 등 시각 강화
- `edu-content/20260206-phaser/script.js`: 이벤트 중복 바인딩 방지(`APP.bound`), 시각화 단계 동적 설명 갱신, 퀴즈 피드백 상세화

### 검증
- `npm test`: 전체 테스트(23개) 통과
- `npm --prefix api run build`: TypeScript 빌드 통과

## Phaser 피타고라스 모듈 아이소메트릭 3D 전면 업그레이드

### 수정
- `edu-content/20260206-phaser/index.html`: 아이소메트릭 3D 콘텐츠용 구조로 재작성, proof-cards 시각 증명 UI 추가
- `edu-content/20260206-phaser/script.js`: 아이소메트릭 투영 시스템(`Iso.toScreen`) 및 3면 블록 렌더링(`drawIsoBlock`) 도입, `MathModel` 수학 로직 분리, 파티클 이펙트(`playAhaEffect`), 타이핑 효과, c²/c 혼합 퀴즈 5문제 풀
- `edu-content/20260206-phaser/style.css`: 그라디언트 타이틀, formula-row/eq-badge 수식 비교 UI, proof-cards 블록 시각화, val-badge 슬라이더 값 표시
- `edu-content/20260206-phaser/CLAUDE.md`: 아이소메트릭 3D 기술 특징 및 학습 목표 4항목으로 확장

### 주요 기술 변경
- **아이소메트릭 투영**: `Iso.toScreen(x, y, z)` 함수로 30도 각도 3D-2D 변환
- **3면 블록 렌더링**: 윗면(0.7 alpha), 왼쪽면(0.5), 오른쪽면(0.4)으로 입체감 표현
- **아이소메트릭 바닥 격자**: 원근감 있는 다이아몬드 격자
- **MathModel 분리**: `MathModel.calc(a, b)` 순수 계산 함수
- **퀴즈 유형 다양화**: c² 계산형 + c 값 계산형 혼합 (5문제)

### 검증
- `node --test tests/phaser-pythagorean-content.test.js`: 테스트 통과 (1 passed, 0 failed)
