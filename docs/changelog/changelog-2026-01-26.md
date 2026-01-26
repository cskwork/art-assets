# Changelog - 2026-01-26

## Art Asset Search Skill 구현

### 추가
- `~/.claude/skills/art-asset-search/SKILL.md` 생성
  - 한국 교육용 아트 에셋 검색 스킬
  - 카테고리: icons, illustrations, diagrams, backgrounds, 3d
  - 태그 기반 검색 지원 (교육 수준, 과목별)
  - Vue/HTML/Three.js 통합 코드 템플릿 포함

- `~/.claude/skills/art-asset-search/references/tag-reference.md` 생성
  - 전체 태그 목록 및 상세 분류
  - 교육 수준, 수학, 과학, UI/UX 등 카테고리별 정리

### 기능
- `assets-index.json` 기반 경량 검색
- 카테고리, 태그, 설명 키워드 필터링
- 경로 자동 생성: `{category}/{id}.{format}`
- 트리거 키워드: "에셋 찾기", "아이콘 검색", "교육용 이미지", "수학 다이어그램", "3D 모델 찾기"

## 초등 5학년 "소수의 곱셈" 인터랙티브 콘텐츠 구현

### 추가
- `edu-content/20260126-decimal-multiplication/` 디렉토리 생성
  - `index.html`: 7개 씬 구조의 인터랙티브 수학 콘텐츠
  - `style.css`: 반응형/터치 지원 스타일 (Noto Sans KR, 오렌지 테마)
  - `script.js`: Three.js 3D 동전, 격자 시각화, 퀴즈 로직

### 씬 구성
1. HookScene: 문제 제시 ("1.5kg 사과가 kg당 2400원이면?")
2. AnchorScene: 자연수 곱셈 복습 (15 x 24 = 360)
3. StoryScene: 편의점 알바생 '하나' 스토리
4. CoreScene: 소수점 위치 이동 시뮬레이터 + 격자 시각화
5. VisualizeScene: 1.5 x 2.4 = 360/100 = 3.6 원리 설명
6. QuizScene: 드래그로 소수점 위치 맞추기 (0.8 x 1.2 = 0.96)
7. WrapScene: 핵심 정리, 다시하기/다음 버튼

### 사용 에셋
- `3d/3d-elementary-coin-gold-20260125.glb` (Three.js 3D 동전)
- `icons/icon-arithmetic-basic-color-20260124.svg`
- `icons/icon-trophy-achievement-cute-20260124.svg`
- `icons/icon-help-question-cute-20260124.svg`
- `icons/icon-lightbulb-idea-bright-20260124.svg`
- `illustrations/illust-calculator-math-simple-20260125.svg`
- `backgrounds/bg-numbers-pattern-20260125.png`

### 기능
- Three.js GLB 모델 로딩 (폴백 지원)
- SVG 기반 격자 곱셈 시각화
- 터치/드래그 퀴즈 인터랙션
- 씬 전환 애니메이션
- 프로그레스 바 표시

## 초등 6학년 "직육면체의 부피" 인터랙티브 콘텐츠 구현

### 추가
- `edu-content/20260126-box-volume/` 디렉토리 생성
  - `index.html`: 7개 씬 구조의 인터랙티브 수학 콘텐츠
  - `style.css`: CSS 3D transform 기반 입체 표현 (파란색 테마 #42A5F5, #1976D2)
  - `script.js`: 층별 큐브 쌓기 인터랙션, 퀴즈 로직

### 씬 구성
1. HookScene: "이 상자에 1cm^3 큐브를 몇 개나 넣을 수 있을까?"
2. AnchorScene: 직사각형 넓이 복습 (가로 x 세로 = 넓이)
3. StoryScene: 택배 기사 '서준'이 스토리 (타자 효과)
4. CoreScene: 3D 박스 내부에 1cm^3 큐브 층층이 쌓기 인터랙션
5. VisualizeScene: 부피 = 가로 x 세로 x 높이 공식 도출
6. QuizScene: "가로 5cm, 세로 3cm, 높이 4cm 상자의 부피는?" (정답: 60cm^3)
7. WrapScene: 직육면체 부피 핵심 정리

### 사용 에셋
- `icons/icon-trophy-achievement-cute-20260124.svg` (완료 트로피)
- `diagrams/diagram-prism-net-unfolded-20260125.svg` (직육면체 전개도)
- `backgrounds/bg-geometric-shapes-20260125.svg` (기하학 패턴 배경)

### 기능
- CSS 3D transform 기반 직육면체/큐브 시각화
- 층별 큐브 쌓기 애니메이션 (순차 등장)
- 실시간 큐브 카운터 (한 층/전체)
- 반응형 디자인 (모바일 대응)
- 프로그레스 바 표시

## 초등 6학년 "비와 비율" 인터랙티브 콘텐츠 구현

### 추가
- `edu-content/20260126-ratio-proportion/` 디렉토리 생성
  - `index.html`: 7개 씬 구조의 인터랙티브 수학 콘텐츠
  - `style.css`: 따뜻한 색상 테마 (#E57373 레드, #FFB74D 오렌지)
  - `script.js`: 슬라이더 기반 비율 조절 인터랙션, 퀴즈 로직

### 씬 구성
1. HookScene: "레시피가 4인분인데, 6명이 먹으려면 재료를 얼마나 넣어야 할까?"
2. AnchorScene: 곱셈과 나눗셈 관계 복습 (역연산)
3. StoryScene: 요리 유튜버 '쉐프 지민' 스토리 (타자 효과)
4. CoreScene: 슬라이더로 인원수 조절 -> 재료 양 비례 변화 (막대 그래프)
5. VisualizeScene: a:b = c:d -> ad = bc (비례식의 성질, 외항/내항)
6. QuizScene: "밀가루 300g에 설탕 100g, 밀가루 450g이면 설탕은?" (정답: 150g)
7. WrapScene: 비와 비율 핵심 정리 + 실생활 예시

### 사용 에셋
- `icons/icon-trophy-achievement-cute-20260124.svg` (완료 트로피)
- `diagrams/diagram-ratio-proportion-blocks-20260125.svg` (비율 블록)
- `backgrounds/bg-grid-paper-20260125.png` (모눈종이 배경)

### 기능
- 슬라이더 인터랙션 (1~10인분 조절)
- 재료별 막대 그래프 실시간 업데이트
- 배수(multiplier) 계산 및 표시
- 커스텀 SVG: 쉐프 캐릭터, 요리 재료, 막대 그래프
- 비례식 시각화 (색상 코딩: a, b, c, d 각각 다른 색)
- 반응형 디자인 (모바일 대응)
- 키보드 네비게이션 (좌우 화살표, 스페이스바)

## 교육 콘텐츠 로컬 실행 안정화

### 수정
- `edu-content/20260126-decimal-multiplication/index.html`: Three.js 비모듈 스크립트 로딩으로 `file://` 환경 호환
- `edu-content/20260126-decimal-multiplication/script.js`: 전역 THREE 사용 및 로드 실패 가드 추가
- `edu-content/20260126-fraction-division/index.html`: Three.js 비모듈 스크립트 로딩으로 `file://` 환경 호환
- `edu-content/20260126-fraction-division/script.js`: 전역 THREE/GLTFLoader/OrbitControls 사용 및 로드 실패 가드 추가

## Art Asset Search Skill - edu-content 내보내기 기능 추가

### 수정
- `~/.claude/skills/art-asset-search/SKILL.md` 업데이트
  - description에 edu-content 관련 트리거 키워드 추가
  - "콘텐츠 내보내기", "모듈 복사", "edu-content export", "교육 콘텐츠 복사"

### 추가
- `Edu-Content 모듈 관리` 섹션 추가
  - 모듈 위치 및 구조 설명
  - 사용 가능한 모듈 목록 (6개)
  - 모듈명 키워드 매핑 (영문/한글)
  - 내보내기 절차 (검색 -> 경로 확인 -> 복사 -> 결과 확인)
  - 덮어쓰기 경고 템플릿
  - 출력 형식 템플릿
  - 사용 예시 4개
