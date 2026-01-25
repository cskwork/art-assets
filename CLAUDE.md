# Art Assets Repository

한국 학생들을 위한 교육용 아트 고유 에셋 저장소. LLM이 에셋을 검색하고 Vue/HTML 프로젝트에 삽입할 수 있도록 구성됨. (For any text that exists should be korean)

## 폴더 구조

```
art-assets/
├── CLAUDE.md             # 이 파일 (LLM 지침서)
├── assets-source.json    # 에셋 소스 (compact 형식, 편집용)
├── assets.json           # 빌드 산출물 (기존 호환 형식)
├── assets-index.json     # LLM 검색용 경량 인덱스
├── scripts/
│   ├── build-assets.js   # 소스 -> assets.json + index 빌드
│   └── migrate-to-compact.js  # 1회성 마이그레이션
├── build-gallery.js      # gallery.html 빌드
├── gallery.html          # 에셋 갤러리 (빌드 산출물)
├── icons/                # 아이콘 (SVG 권장)
├── illustrations/        # 일러스트레이션 (SVG/PNG)
├── backgrounds/          # 배경 이미지 (JPG/PNG)
├── diagrams/             # 다이어그램, 차트 (SVG/PNG)
├── photos/               # 사진 (JPG)
└── 3d/                   # 3D 모델/씬 (Three.js GLB/GLTF)
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
  "updated": "2026-01-25",
  "categories": {
    "icons": { "d": "아이콘 (SVG 권장)", "f": "svg" },
    "3d": { "d": "3D 모델", "f": "glb" }
  },
  "assets": [
    ["icon-checkmark-green-20260124", "icons", ["checkmark","success"], "녹색 체크마크 아이콘"],
    ["3d-sphere-red-20260125", "3d", ["geometry","math"], "빨간 구 3D 모델", "glb", [100,100]]
  ]
}
```

**배열 형식**: `[id, category, tags[], description, format?, dimensions?]`
- `format`: 기본값과 다를 경우만 추가 (icons=svg, 3d=glb 등)
- `dimensions`: `[width, height]` 또는 `[w, h, d]` (있을 경우만)

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

## 빌드 명령어

```bash
# 전체 빌드 (assets + gallery)
node build-gallery.js

# assets만 빌드
node scripts/build-assets.js
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

## 주의사항

- 에셋 추가 시 `assets-source.json` 편집 후 빌드 실행
- `assets.json`은 빌드 산출물이므로 직접 편집 금지
- 파일명에 공백, 특수문자 사용 금지
- 큰 파일(>1MB)은 압축 권장
- 저작권 확인 필수
