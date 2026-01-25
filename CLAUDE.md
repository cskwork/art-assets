# Art Assets Repository

한국 학생들을 위한 교육용 아트 에셋 저장소. LLM이 에셋을 검색하고 Vue/HTML 프로젝트에 삽입할 수 있도록 구성됨. (For any text that exists should be korean)

## 폴더 구조

```
art-assets/
├── CLAUDE.md          # 이 파일 (LLM 지침서)
├── assets.json        # 에셋 메타데이터 매니페스트
├── icons/             # 아이콘 (SVG 권장)
├── illustrations/     # 일러스트레이션 (SVG/PNG)
├── backgrounds/       # 배경 이미지 (JPG/PNG)
├── diagrams/          # 다이어그램, 차트 (SVG/PNG)
└── photos/            # 사진 (JPG)
```

## 파일 명명 규칙

**형식**: `{category}-{description}-{variant}-{YYYYMMDD}.{ext}`

| 필드 | 설명 | 예시 |
|------|------|------|
| category | 카테고리 약어 | icon, illust, bg, diagram, photo |
| description | kebab-case 설명 | checkmark, user-profile, login-flow |
| variant | 변형 (선택) | green, dark, wide, ko |
| YYYYMMDD | 생성일 | 20260124 |
| ext | 확장자 | svg, png, jpg |

**예시**:
- `icon-checkmark-green-20260124.svg`
- `photo-classroom-wide-20260124.jpg`
- `diagram-login-flow-20260124.svg`
- `bg-gradient-blue-20260124.png`

## assets.json 스키마

```json
{
  "version": "1.0.0",
  "lastUpdated": "YYYY-MM-DD",
  "categories": { ... },
  "assets": [
    {
      "id": "icon-checkmark-green-20260124",
      "path": "icons/icon-checkmark-green-20260124.svg",
      "category": "icons",
      "tags": ["checkmark", "success", "green", "ui"],
      "description": "녹색 체크마크 아이콘",
      "dimensions": { "width": 24, "height": 24 },
      "format": "svg",
      "addedDate": "2026-01-24"
    }
  ]
}
```

### 필수 필드
- `id`: 파일명 (확장자 제외)
- `path`: 상대 경로
- `category`: icons | illustrations | backgrounds | diagrams | photos
- `tags`: 검색용 태그 배열
- `description`: 한글 설명

### 선택 필드
- `dimensions`: { width, height } (픽셀)
- `format`: svg | png | jpg
- `addedDate`: 추가일

## 에셋 추가 절차

1. 파일명 규칙에 따라 파일 생성
2. 해당 카테고리 폴더에 파일 저장
3. `assets.json`의 `assets` 배열에 메타데이터 추가
4. `lastUpdated` 날짜 갱신

## LLM 사용 가이드

### 에셋 검색

1. `assets.json` 읽기
2. `tags` 또는 `description`으로 필터링
3. 적합한 에셋의 `path` 확인

```javascript
// 검색 예시: "success" 관련 아이콘 찾기
const assets = require('./assets.json');
const found = assets.assets.filter(a =>
  a.category === 'icons' && a.tags.includes('success')
);
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

| 카테고리 | 권장 형식 | 이유 |
|----------|-----------|------|
| icons | SVG | 벡터, 크기 조절 용이 |
| illustrations | SVG, PNG | 벡터 우선, 복잡한 경우 PNG |
| backgrounds | JPG, PNG | 사진형 JPG, 투명 필요시 PNG |
| diagrams | SVG, PNG | 편집 가능한 SVG 우선 |
| photos | JPG | 파일 크기 효율 |

## 주의사항

- 에셋 추가 시 반드시 `assets.json` 업데이트
- 파일명에 공백, 특수문자 사용 금지
- 큰 파일(>1MB)은 압축 권장
- 저작권 확인 필수
