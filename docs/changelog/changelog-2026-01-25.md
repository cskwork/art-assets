# Changelog 2026-01-25

## assets.json 효율화

### 변경 사항

1. **compact 소스 형식 도입**
   - `assets-source.json`: 배열 형식으로 키 이름 제거
   - 편집 시 이 파일 수정

2. **빌드 시스템 추가**
   - `scripts/build-assets.js`: 소스 -> 전체/인덱스 빌드
   - `scripts/migrate-to-compact.js`: 1회성 마이그레이션

3. **LLM 검색용 경량 인덱스**
   - `assets-index.json`: 25.5KB (검색 최적화)

4. **빌드 통합**
   - `build-gallery.js`: assets 빌드 후 gallery 생성
   - 3d 카테고리 갤러리 지원 추가

### 파일 크기

| 파일 | 크기 | 용도 |
|------|------|------|
| assets-source.json | 41.6KB | 편집용 소스 |
| assets.json | 68.5KB | 기존 호환 (빌드 산출물) |
| assets-index.json | 25.5KB | LLM 검색용 |

### 신규 파일

- `scripts/build-assets.js`
- `scripts/migrate-to-compact.js`
- `assets-source.json`
- `assets-index.json`
- `docs/changelog/changelog-2026-01-25.md`

### 수정 파일

- `build-gallery.js`: assets 빌드 호출, 3d 카테고리 추가
- `CLAUDE.md`: 새 형식 및 워크플로우 문서화
