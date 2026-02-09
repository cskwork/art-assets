# Art Assets Repository

한국 학생들을 위한 교육용 아트 고유 에셋 저장소. LLM이 에셋을 검색하고 Vue/HTML 프로젝트에 삽입할 수 있도록 구성됨. (For any text that exists should be korean)

## 최근 활동

### 2026-01-28

**Phaser.io 기반 수학 게임 2개 생성**
- 구구단 레이싱 (초등 2-3학년): 떨어지는 문제 맞추기, 콤보 시스템
  - 2~9단 문제가 하늘에서 떨어짐
  - 숫자 키패드로 정답 입력
  - 연속 정답 시 콤보 보너스 (+5~+25점)
  - 로봇 캐릭터 "멀티봇"과 함께 학습
  - 15문제 + 5문제 퀴즈
- 좌표 탐험대 (초등 5-6학년): 좌표평면 위 보물찾기
  - (x, y) 좌표 읽고 정확한 위치 클릭
  - -4~4 범위의 좌표평면
  - 탐험가 캐릭터 "코디"와 함께 학습
  - 8개 보물 찾기 + 5문제 퀴즈 (사분면, 원점, 축)
- 기술: Phaser 3.80.1 CDN, Graphics API 아이콘, Tween 애니메이션
- 위치: `edu-content/20260128-multiplication-racing/`, `edu-content/20260128-coordinate-explorer/`

### 2026-01-27

**Three.js 기반 중학교 수학 3D 콘텐츠 생성**
- 피타고라스 정리 (중2): 3D 큐브 부피 증명, 슬라이더로 변 조절
  - a² + b² = c² 시각적 증명
  - 3개 정사각형 3D 모델, 실시간 수식 업데이트
  - 6-8-10 퀴즈 (정답: 10)
- 회전체 (중3): 2D→3D 변환 애니메이션, 도형 선택 + 회전 슬라이더
  - 직사각형→원기둥, 직각삼각형→원뿔, 반원→구
  - 0°~360° 점진적 회전 시각화
  - 부피 공식 카드 (πr²h, ⅓πr²h, ⁴⁄₃πr³)
- 기술: Three.js r160, ES Modules, OrbitControls, 카메라 애니메이션
- 위치: `edu-content/20260127-pythagorean-3d/`, `edu-content/20260127-rotation-solid/`

**Phaser.io 기반 게임형 교육 콘텐츠 생성**
- 동작 동사 분류 게임 Action Verbs (초등 3-4학년): Phaser 3 아케이드 물리, 드래그 앤 드롭
  - run/walk/jump (움직임), draw/write/cook (만들기), love/like/hate (감정) 분류
  - 드래그로 동사를 카테고리에 분류하는 게임 메카닉
  - 로봇 캐릭터 "Verby"와 함께 학습
  - 점수 시스템, 3라운드 + 5문제 퀴즈
- 기술: Phaser 3.80.1 CDN, Tween 애니메이션, Registry 상태 관리
- 위치: `edu-content/20260127-action-verbs-phaser/`
- **NEW:** Phaser 스킬 생성 (`~/.claude/skills/Phaser/SKILL.md`)

**Three.js 기반 3D 영어 콘텐츠 생성**
- 3D 위치 전치사 (초등 3-4학년): Three.js OrbitControls, 실시간 3D 애니메이션
  - in, on, under, next to, between 전치사 학습
  - 3D 장면에서 공의 위치가 실시간으로 변화
  - 로봇 캐릭터 "Rex"와 함께 학습
  - 5개 퀴즈: 3D 장면을 보고 올바른 전치사 선택
- 기술: Three.js r128, OrbitControls, Web Speech API
- 위치: `edu-content/20260127-prepositions-3d/`

### 2026-01-26

**초등 영어 인터랙티브 콘텐츠 3개 모듈 완성**
- 비교급 Comparative Adjectives (초등 5-6학년): -er vs more 규칙, 드래그앤드롭 단어 변환, 불규칙 비교급
- 현재시제 Present Simple vs Continuous (초등 5-6학년): 습관 vs 진행, 문장 분류 게임, 키워드 기반 학습
- 조동사 Can/Can't (초등 5-6학년): 능력 표현, 긍정/부정/의문문, 능력 카드 게임
- 공통: 7씬 구조, 커스텀 SVG 캐릭터, Web Speech API 발음, 한국어 설명 + 영어 타겟 언어

**Archive 버튼 직접 실행 기능**
- `server.js` 생성: Node.js HTTP 서버, 정적 파일 서빙, Archive/Restore API 엔드포인트
  - `POST /api/archive/:assetId`: 에셋 아카이브
  - `POST /api/restore/:assetId`: 에셋 복원
  - 응답 후 자동 빌드 및 페이지 새로고침
  - 경로 탐색 공격 방지 (ROOT_DIR 외부 접근 차단)
- `scripts/archive.js` 리팩토링: CLI + 모듈 양쪽 지원
  - `archiveAsset()`, `restoreAsset()` 함수 export
  - `options.runBuild` 파라미터로 빌드 실행 제어
  - 모듈 호환성 위해 `throw Error` 사용
- `build-gallery.js` 갤러리 빌드 업데이트
  - archived 에셋 로드 및 전개
  - 모달 UI: 로딩/성공/실패 상태 표시
  - fetch API로 서버에 요청

**Art Asset Archive 기능 구현**
- `scripts/archive.js` CLI 도구: 에셋 아카이브/복원 명령어
- `assets-source.json`에 `archived` 배열 추가
- 갤러리에 Archive/Restore 버튼 및 Archived 탭 추가
- `archive/` 폴더 구조 생성 (각 카테고리별 하위 폴더)

**Art Asset Search Skill 구현**
- `~/.claude/skills/art-asset-search/` 스킬 디렉토리 생성
  - `SKILL.md`: 한국 교육용 아트 에셋 검색 스킬 정의
  - `references/tag-reference.md`: 전체 태그 목록 및 카테고리 분류
- 기능: `assets-index.json` 기반 경량 검색, 카테고리/태그/설명 필터링
- 트리거 키워드: "에셋 찾기", "아이콘 검색", "교육용 이미지", "수학 다이어그램", "3D 모델 찾기", "콘텐츠 내보내기", "교육 콘텐츠 복사"

**초등 수학 인터랙티브 콘텐츠 5개 모듈 완성**
- 소수의 곱셈 (초등 5학년): Three.js 3D 동전, SVG 격자 시각화, 터치 드래그 퀴즈
- 분수의 나눗셈 (초등 5학년): GLTFLoader/OrbitControls 3D 모델, 비모듈 스크립트 (`file://` 호환)
- 직육면체 부피 (초등 6학년): CSS 3D transform 큐브, 층별 쌓기 인터랙션, 큐브 카운터
- 원의 넓이 (초등 6학년): SVG 부채꼴 분할, MathJax 공식, 슬라이더 조절
- 비와 비율 (초등 6학년): 슬라이더 인원수 조절, 막대 그래프 실시간 업데이트, 비례식 시각화

**공통 기술 스택**
- 7씬 표준 구조: Hook > Anchor > Story > Core > Visualize > Quiz > Wrap
- ContentApp 싱글톤 패턴, Noto Sans KR, 반응형/터치
- 프로그레스 바, 타자 효과, 에셋 참조 (아이콘/다이어그램/배경/3D)

## 폴더 구조

```
art-assets/
├── CLAUDE.md             # 이 파일 (LLM 지침서)
├── assets-source.json    # 에셋 소스 (compact 형식, 편집용)
├── assets.json           # 빌드 산출물 (기존 호환 형식)
├── assets-index.json     # LLM 검색용 경량 인덱스
├── server.js             # 갤러리 서버 (Archive/Restore API 포함)
├── scripts/
│   ├── build-assets.js   # 소스 -> assets.json + index 빌드
│   ├── archive.js        # 에셋 아카이브/복원 CLI + 모듈
│   └── migrate-to-compact.js  # 1회성 마이그레이션
├── build-gallery.js      # gallery.html 빌드
├── gallery.html          # 에셋 갤러리 (빌드 산출물)
├── icons/                # 아이콘 (SVG 권장)
├── illustrations/        # 일러스트레이션 (SVG/PNG)
├── backgrounds/          # 배경 이미지 (JPG/PNG)
├── diagrams/             # 다이어그램, 차트 (SVG/PNG)
├── photos/               # 사진 (JPG)
├── 3d/                   # 3D 모델/씬 (Three.js GLB/GLTF)
├── archive/              # 아카이브된 에셋 (카테고리별 하위 폴더)
└── edu-content/          # 교육용 인터랙티브 콘텐츠
    ├── 20260126-box-volume/        # 직육면체 부피 (초등 6학년)
    ├── 20260126-circle-area/       # 원의 넓이 (초등 6학년)
    ├── 20260126-decimal-multiplication/  # 소수의 곱셈 (초등 5학년)
    ├── 20260126-fraction-division/       # 분수의 나눗셈 (초등 5학년)
    ├── 20260126-ratio-proportion/        # 비와 비율 (초등 6학년)
    ├── 20260127-prepositions-3d/         # 3D 위치 전치사 (초등 3-4학년) - Three.js
    ├── 20260127-action-verbs-phaser/     # 동작 동사 분류 게임 (초등 3-4학년) - Phaser
    ├── 20260127-pythagorean-3d/          # 피타고라스 정리 (중2) - Three.js 3D
    └── 20260127-rotation-solid/          # 회전체 (중3) - Three.js 3D
```

## 파일 명명 규칙

**형식**: `{category}-{description}-{variant}-{YYYYMMDD}.{ext}`

| 필드 | 설명 | 예시 |
|------|------|------|
| category | 카테고리 약어 | icon, illust, bg, diagram, photo, 3d |
| description | kebab-case 설명 | checkmark, user-profile, login-flow |
| variant | 변형 (선택) | green, dark, wide, ko |
| YYYYMMDD | 생성일 | 20260124 |
| ext | 확장자 | svg, png, jpg, glb, gltf |

**예시**:
- `icon-checkmark-green-20260124.svg`
- `photo-classroom-wide-20260124.jpg`
- `diagram-login-flow-20260124.svg`
- `bg-gradient-blue-20260124.png`
- `3d-molecule-water-20260125.glb`

## 에셋 파일 구조

### assets-source.json (소스, compact 형식)

에셋 편집 시 이 파일을 수정합니다.

```json
{
  "v": "2.0.0",
  "updated": "2026-01-26",
  "categories": {
    "icons": { "d": "아이콘 (SVG 권장)", "f": "svg" },
    "3d": { "d": "3D 모델", "f": "glb" }
  },
  "assets": [
    ["icon-checkmark-green-20260124", "icons", ["checkmark","success"], "녹색 체크마크 아이콘"],
    ["3d-sphere-red-20260125", "3d", ["geometry","math"], "빨간 구 3D 모델", "glb", [100,100]]
  ],
  "archived": [
    ["old-asset-id", "icons", ["tag"], "설명", null, null, "2026-01-26"]
  ]
}
```

**assets 배열 형식**: `[id, category, tags[], description, format?, dimensions?]`
- `format`: 기본값과 다를 경우만 추가 (icons=svg, 3d=glb 등)
- `dimensions`: `[width, height]` 또는 `[w, h, d]` (있을 경우만)

**archived 배열 형식**: `[id, category, tags[], description, format?, dimensions?, archivedDate]`
- `archivedDate`: 아카이브된 날짜 (YYYY-MM-DD)

### assets.json (빌드 산출물, 기존 호환)

빌드 시 자동 생성됩니다. 직접 편집하지 마세요.

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-25",
  "categories": { ... },
  "assets": [
    {
      "id": "icon-checkmark-green-20260124",
      "path": "icons/icon-checkmark-green-20260124.svg",
      "category": "icons",
      "tags": ["checkmark", "success"],
      "description": "녹색 체크마크 아이콘",
      "format": "svg",
      "addedDate": "2026-01-24"
    }
  ]
}
```

### assets-index.json (LLM 검색용 경량)

```json
{
  "v": "2.0.0",
  "stats": { "total": 159, "icons": 34, "3d": 25 },
  "assets": [
    { "id": "icon-checkmark-green-20260124", "c": "icons", "t": ["checkmark","success"], "d": "녹색 체크마크" }
  ]
}
```

## 에셋 추가 절차

1. 파일명 규칙에 따라 파일 생성
2. 해당 카테고리 폴더에 파일 저장
3. `assets-source.json`의 `assets` 배열에 compact 형식으로 추가
4. `updated` 날짜 갱신
5. 빌드 실행: `node build-gallery.js`

## 빌드 및 실행 명령어

```bash
# 전체 빌드 (assets + gallery)
node build-gallery.js

# assets만 빌드
node scripts/build-assets.js

# 갤러리 서버 실행 (Archive/Restore 버튼 UI 통합)
node server.js
# http://localhost:3000 접속
# Archive/Restore 버튼 클릭 시 fetch API로 요청 -> 자동 빌드 -> 페이지 새로고침

# CLI: 에셋 아카이브
node scripts/archive.js --archive "asset-id"

# CLI: 아카이브된 에셋 복원
node scripts/archive.js --restore "asset-id"

# CLI: 아카이브 목록 확인
node scripts/archive.js --list
```

## LLM 사용 가이드

### 에셋 검색 (권장: assets-index.json)

```javascript
// assets-index.json 사용 (경량, 빠름)
const idx = require('./assets-index.json');
const found = idx.assets.filter(a =>
  a.c === 'icons' && a.t.includes('success')
);
// 경로 생성: {category}/{id}.{format}
const path = `icons/${found[0].id}.svg`;
```

### 에셋 검색 (기존 방식: assets.json)

```javascript
const assets = require('./assets.json');
const found = assets.assets.filter(a =>
  a.category === 'icons' && a.tags.includes('success')
);
const path = found[0].path;
```

### Vue 컴포넌트 삽입

```vue
<template>
  <!-- 이미지 태그 -->
  <img :src="assetPath('icons/icon-checkmark-green-20260124.svg')" alt="체크마크" />

  <!-- 배경 이미지 -->
  <div :style="{ backgroundImage: `url(${assetPath('backgrounds/bg-gradient-blue-20260124.png')})` }">
  </div>
</template>

<script setup>
// 에셋 경로 헬퍼 (프로젝트 설정에 따라 조정)
const assetPath = (path) => `/assets/${path}`;

// Three.js GLB 로딩 예시
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
const loader = new GLTFLoader();
loader.load(assetPath('3d/3d-molecule-water-20260125.glb'), (gltf) => {
  scene.add(gltf.scene);
});
</script>
```

### HTML 삽입

```html
<!-- 직접 참조 -->
<img src="./art-assets/icons/icon-checkmark-green-20260124.svg" alt="체크마크" />

<!-- CSS 배경 -->
<style>
.hero {
  background-image: url('./art-assets/backgrounds/bg-gradient-blue-20260124.png');
}
</style>
```

## 권장 형식

| 카테고리 | 권장 형식 | 기본값 |
|----------|-----------|--------|
| icons | SVG | svg |
| illustrations | SVG, PNG | svg |
| backgrounds | JPG, PNG | png |
| diagrams | SVG, PNG | svg |
| photos | JPG | jpg |
| 3d | GLB, GLTF | glb |

## Edu-Content 모듈 구조

### 모듈 위치
- `edu-content/{YYYYMMDD}-{module-name}/`
  - `index.html`: 7씬 인터랙티브 콘텐츠 메인 파일
  - `script.js`: 씬 네비게이션, 인터랙션 로직
  - `style.css`: 반응형/터치 지원, 색상 테마

### 사용 가능한 모듈

#### 수학 (Math)
| 폴더 | 주제 | 학년 | 파일 |
|------|------|------|------|
| 20260126-box-volume | 직육면체 부피 | 초등 6학년 | `/edu-content/20260126-box-volume/` |
| 20260126-circle-area | 원의 넓이 | 초등 6학년 | `/edu-content/20260126-circle-area/` |
| 20260126-decimal-multiplication | 소수의 곱셈 | 초등 5학년 | `/edu-content/20260126-decimal-multiplication/` |
| 20260126-fraction-division | 분수의 나눗셈 | 초등 5학년 | `/edu-content/20260126-fraction-division/` |
| 20260126-ratio-proportion | 비와 비율 | 초등 6학년 | `/edu-content/20260126-ratio-proportion/` |
| 20260127-pythagorean-3d | **피타고라스 정리 (Three.js 3D)** | 중학교 2학년 | `/edu-content/20260127-pythagorean-3d/` |
| 20260127-rotation-solid | **회전체 (Three.js 3D)** | 중학교 3학년 | `/edu-content/20260127-rotation-solid/` |
| 20260128-multiplication-racing | **구구단 레이싱 (Phaser 게임)** | 초등 2-3학년 | `/edu-content/20260128-multiplication-racing/` |
| 20260128-coordinate-explorer | **좌표 탐험대 (Phaser 게임)** | 초등 5-6학년 | `/edu-content/20260128-coordinate-explorer/` |

#### 영어 (English)
| 폴더 | 주제 | 학년 | 파일 |
|------|------|------|------|
| 20260126-comparative-adjectives | 비교급 (-er/more) | 초등 5-6학년 | `/edu-content/20260126-comparative-adjectives/` |
| 20260126-present-tenses | 현재시제 vs 현재진행형 | 초등 5-6학년 | `/edu-content/20260126-present-tenses/` |
| 20260126-modal-can | 조동사 can/can't | 초등 5-6학년 | `/edu-content/20260126-modal-can/` |
| 20260127-prepositions-3d | **3D 위치 전치사 (Three.js)** | 초등 3-4학년 | `/edu-content/20260127-prepositions-3d/` |
| 20260127-action-verbs-phaser | **동작 동사 분류 게임 (Phaser)** | 초등 3-4학년 | `/edu-content/20260127-action-verbs-phaser/` |

### 7씬 표준 구조
1. **Hook**: 흥미로운 문제 제시 및 3D 시각화
2. **Anchor**: 선행학습 개념 복습
3. **Story**: 캐릭터 스토리 (타자 효과)
4. **Core**: 인터랙티브 핵심 학습 (3D/슬라이더/드래그)
5. **Visualize**: 공식 도출 및 개념 설명
6. **Quiz**: 객관식 문제 풀이
7. **Wrap**: 학습 요약 및 보상 화면

### 모듈 복사 절차
1. 모듈 폴더 전체 복사
2. 대상 프로젝트에 `edu-content/` 디렉토리 생성
3. 모듈 폴더 붙여넣기
4. `index.html`에서 에셋 경로 확인 (상대 경로: `../../icons/`, `../../diagrams/` 등)
5. 브라우저에서 `index.html` 열기 (로컬 서버 권장)

### 기술 스택
- **HTML**: 시맨틱 마크업, Noto Sans KR 폰트
- **CSS**: 3D transform, 반응형 그리드, 터치 친화적 버튼
- **JavaScript**: 순수 JS (프레임워크 불필요), ContentApp 싱글톤 패턴
- **3D**: Three.js GLB/GLTF 로더 (비모듈 로딩)
- **2D 게임**: Phaser 3 (아케이드 물리, 드래그앤드롭, 점수 시스템)
- **수식**: MathJax 3 (인라인 수식 렌더링)
- **SVG**: 동적 도형 생성 (부채꼴, 격자, 캐릭터)

### 주의사항
- 에셋 경로는 모듈 위치 기준 상대 경로 사용
- Three.js는 전역 `window.THREE` 변수로 접근
- `file://` 프로토콜 환경에서 CORS 이슈 해결: 비모듈 스크립트 로딩
- 모바일 환경 테스트 필수 (터치 드래그, 반응형 레이아웃)

## 개발 패턴

### ContentApp 싱글톤 패턴
모든 모듈은 전역 `ContentApp` 객체로 상태와 메서드 관리:
- `currentScene`: 현재 씬 인덱스
- `scenes`: 씬 ID 배열
- `nextScene()`: 씬 전환
- `init()`: 초기화
- `checkAnswer()`: 퀴즈 검증

### 3D 모델 로딩 (비모듈, `file://` 호환)
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
```
- 로드 가드: `if (!THREE || !THREE.GLTFLoader || !THREE.OrbitControls) { }`
- 접근: `THREE.GLTFLoader()`, `THREE.OrbitControls`

### MathJax 수식 렌더링
- 인라인 설정: `$...$` 구분자
- 씬 전환 후 재렌더링: `window.MathJax.typesetPromise([sceneEl])`

### Phaser 게임 개발 (2D 인터랙티브)
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
```
- 씬 클래스 기반: `class GameScene extends Phaser.Scene { }`
- 드래그앤드롭: `setInteractive({ draggable: true })`
- 전역 상태: `this.registry.set('score', 0)`
- 애니메이션: `this.tweens.add({ targets, scale, duration, ease })`
- Three.js vs Phaser 선택:
  - 3D 시각화 → Three.js
  - 게임 메카닉 (점수, 물리, 충돌) → Phaser

## 주의사항

- 에셋 추가 시 `assets-source.json` 편집 후 빌드 실행
- `assets.json`은 빌드 산출물이므로 직접 편집 금지
- 파일명에 공백, 특수문자 사용 금지
- 큰 파일(>1MB)은 압축 권장
- 저작권 확인 필수
