/**
 * migrate-to-compact.js
 * assets.json -> assets-source.json (compact 형식) 변환
 * 1회성 마이그레이션 스크립트
 */

const fs = require('fs');
const path = require('path');

const assetsPath = path.join(__dirname, '..', 'assets.json');
const outputPath = path.join(__dirname, '..', 'assets-source.json');

// 현재 assets.json 로드
const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));

// 카테고리 정보 압축
const categories = {};
for (const [key, value] of Object.entries(assets.categories)) {
  categories[key] = {
    d: value.description,
    f: value.recommendedFormat
  };
}

// 카테고리별 기본 포맷 매핑
const defaultFormats = {
  icons: 'svg',
  illustrations: 'svg',
  diagrams: 'svg',
  backgrounds: 'png',
  photos: 'jpg',
  '3d': 'glb'
};

/**
 * compact 형식: [id, category, tags[], description, format?, dimensions?]
 * - format: 카테고리 기본값과 다를 경우만 포함
 * - dimensions: 있을 경우만 포함 (width, height 또는 3D의 경우 [w, h, d])
 */
function convertToCompact(asset) {
  const { id, category, tags, description, format, dimensions } = asset;

  // 기본 배열: [id, category, tags, description]
  const compact = [id, category, tags, description];

  // format: 기본값과 다를 경우에만 추가
  const defaultFormat = defaultFormats[category];
  const needsFormat = format && format !== defaultFormat;

  // dimensions 처리
  let dims = null;
  if (dimensions) {
    if (dimensions.width && dimensions.height) {
      if (dimensions.depth) {
        dims = [dimensions.width, dimensions.height, dimensions.depth];
      } else {
        dims = [dimensions.width, dimensions.height];
      }
    }
  }

  // 추가 필드가 필요한 경우
  if (needsFormat || dims) {
    compact.push(needsFormat ? format : null);
  }
  if (dims) {
    compact.push(dims);
  }

  return compact;
}

// compact 형식으로 변환
const compactAssets = assets.assets.map(convertToCompact);

// 출력 구조
const output = {
  v: "2.0.0",
  updated: assets.lastUpdated,
  categories,
  assets: compactAssets
};

// 파일 저장
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

// 통계 출력
const originalSize = fs.statSync(assetsPath).size;
const compactSize = fs.statSync(outputPath).size;
const reduction = ((originalSize - compactSize) / originalSize * 100).toFixed(1);

console.log('=== 마이그레이션 완료 ===');
console.log(`원본: ${(originalSize / 1024).toFixed(1)}KB`);
console.log(`압축: ${(compactSize / 1024).toFixed(1)}KB`);
console.log(`절감: ${reduction}%`);
console.log(`에셋 수: ${compactAssets.length}개`);
console.log(`출력: ${outputPath}`);
