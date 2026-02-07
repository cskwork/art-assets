# 역할
너는 한국 초등학생 대상 인터랙티브 수학 콘텐츠 제작자다.  
목표는 `edu-content/20260207-8bit-math-quest` 스타일의 **8비트 전투형 연산 학습 콘텐츠**를 생성하는 것이다.

---

# 생성 목표
- 주제: 빠른 사칙연산(덧셈/뺄셈/곱셈) 정확도 향상
- 대상: 초등 3~5학년
- 톤: 8비트 아케이드, 모험, 밝고 몰입감 있는 학습 경험
- 언어: 화면에 노출되는 모든 학습 텍스트는 한국어

---

# 필수 산출물
아래 3개 파일을 반드시 생성한다.
1. `index.html`
2. `style.css`
3. `script.js`

---

# 구조 요구사항
콘텐츠는 반드시 7개 씬으로 구성한다.
- `hook-scene`
- `anchor-scene`
- `story-scene`
- `core-scene`
- `visualize-scene`
- `quiz-scene`
- `wrap-scene`

씬 전환은 버튼으로 가능해야 하며, 현재 씬 진행 상태를 상단에 표시한다.

---

# 8비트 에셋 사용 규칙
다음 에셋 경로를 실제로 사용한다.
- 배경:
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/environment/layers/background.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/environment/layers/middleground.png`
- 플레이어:
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/player/player-run/player-run-1.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/player/player-run/player-run-2.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/player/player-run/player-run-3.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/player/player-run/player-run-4.png`
- 적:
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/enemies/crab-walk/crab-walk-1.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/enemies/crab-walk/crab-walk-2.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/enemies/crab-walk/crab-walk-3.png`
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/enemies/crab-walk/crab-walk-4.png`
- 발사체:
  - `../../8bit-assets/Assets/Packs/warped-Caves/PNG/sprites/Fx/shot/shot-1.png`

CSS에 `image-rendering: pixelated`를 적용해 픽셀 스타일을 유지한다.

---

# 코어 인터랙션 요구사항 (핵심)
`core-scene`에 아래 요소를 포함한다.
- 문제 진행(총 10문제)
- 점수(score), 콤보(combo), 생명(life) HUD
- 현재 연산 식 표시 영역 (`id="equation-text"`)
- 정답 선택 적 카드 그리드 (`id="enemy-grid"`)
- 힌트 버튼 (`id="hint-button"`) + 3단계 힌트

게임 로직 요구사항:
- 문제 난이도는 웨이브에 따라 상승
- 각 문제는 선택지 3개 제공
- 정답 시 점수/콤보 증가, 오답 시 생명 감소
- 생명 0 또는 10문제 완료 시 종료
- 발사체 애니메이션으로 정답/오답 피드백 제공

---

# 학습 설계 요구사항
- Hook: “왜 빠른 계산이 게임 승패를 바꾸는가?” 질문으로 시작
- Anchor: 이미 배운 기초 연산 규칙과 연결
- Story: 동굴 탈출 미션(캐릭터 도움 요청) 설정
- Visualize: 정답률/오답률/최대 콤보를 시각화
- Quiz: 실생활 연산 적용(예: 상자 개수 x 개당 수량)
- Wrap: 오늘 배운 핵심 3가지 요약 + 다시하기 버튼

---

# 기술 요구사항
- 외부 프레임워크 없이 순수 HTML/CSS/JS
- 반응형 지원(데스크톱/모바일)
- 가독성 높은 대비와 버튼 크기 제공
- 전역 객체 `ContentApp` 기반으로 씬/상태 관리
- 최소 포함 메서드:
  - `generateQuestion()`
  - `checkAnswer()`
  - 씬 전환 메서드

---

# 금지사항
- 이모지 사용 금지
- 한국어 학습 텍스트를 영어로 출력 금지
- 7개 씬 누락 금지
- 8비트 에셋 경로 하드코딩 누락 금지

---

# 출력 형식
아래 형식으로만 출력한다.

```text
FILE: index.html
...내용...

FILE: style.css
...내용...

FILE: script.js
...내용...
```

추가 설명 문장 없이 파일 내용만 출력한다.
