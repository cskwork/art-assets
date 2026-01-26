/**
 * build-assets.js
 * assets-source.json (compact) -> assets.json + assets-index.json 생성
 *
 * 사용법: node scripts/build-assets.js
 */

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'assets-source.json');
const assetsPath = path.join(__dirname, '..', 'assets.json');
const indexPath = path.join(__dirname, '..', 'assets-index.json');

// compact 소스 로드
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// 카테고리별 기본 포맷
const defaultFormats = {
  icons: 'svg',
  illustrations: 'svg',
  diagrams: 'svg',
  backgrounds: 'png',
  photos: 'jpg',
  '3d': 'glb'
};

// 카테고리별 폴더 매핑
const categoryFolders = {
  icons: 'icons',
  illustrations: 'illustrations',
  diagrams: 'diagrams',
  backgrounds: 'backgrounds',
  photos: 'photos',
  '3d': '3d'
};

/**
 * compact 형식에서 full 형식으로 변환
 * compact: [id, category, tags[], description, format?, dimensions?]
 */
function expandAsset(compact) {
  const [id, category, tags, description, format, dimensions] = compact;

  // format 결정: 명시적으로 있으면 사용, 없으면 기본값
  const assetFormat = format || defaultFormats[category] || 'svg';

  // path 자동 생성
  const folder = categoryFolders[category] || category;
  const assetPath = `${folder}/${id}.${assetFormat}`;

  // addedDate 추출 (id에서 YYYYMMDD 형식)
  const dateMatch = id.match(/(\d{8})$/);
  const addedDate = dateMatch
    ? `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`
    : source.updated;

  // 기본 구조
  const asset = {
    id,
    path: assetPath,
    category,
    tags,
    description,
    format: assetFormat,
    addedDate
  };

  // dimensions 추가 (있으면)
  if (dimensions && Array.isArray(dimensions)) {
    if (dimensions.length === 2) {
      asset.dimensions = { width: dimensions[0], height: dimensions[1] };
    } else if (dimensions.length === 3) {
      asset.dimensions = { width: dimensions[0], height: dimensions[1], depth: dimensions[2] };
    }
  }

  return asset;
}

/**
 * 중복 ID 검사
 */
function validateAssets(assets) {
  const ids = new Set();
  const duplicates = [];

  for (const asset of assets) {
    const id = asset[0];
    if (ids.has(id)) {
      duplicates.push(id);
    }
    ids.add(id);
  }

  if (duplicates.length > 0) {
    console.error('중복 ID 발견:', duplicates);
    return false;
  }
  return true;
}

// 유효성 검사
if (!validateAssets(source.assets)) {
  process.exit(1);
}

// full 형식 에셋 배열 생성
const fullAssets = source.assets.map(expandAsset);

// 카테고리 정보 복원
const categories = {};
for (const [key, value] of Object.entries(source.categories)) {
  categories[key] = {
    description: value.d,
    recommendedFormat: value.f
  };
}

// assets.json 생성 (기존 호환 형식)
const assetsOutput = {
  version: "1.0.0",
  lastUpdated: source.updated,
  categories,
  assets: fullAssets
};

fs.writeFileSync(assetsPath, JSON.stringify(assetsOutput, null, 2), 'utf8');

// assets-index.json 생성 (LLM 검색용 경량 형식)
const stats = {};
fullAssets.forEach(asset => {
  stats[asset.category] = (stats[asset.category] || 0) + 1;
});

const indexAssets = fullAssets.map(asset => ({
  id: asset.id,
  c: asset.category,
  t: asset.tags,
  d: asset.description
}));

const indexOutput = {
  v: "2.0.0",
  updated: source.updated,
  stats: { total: fullAssets.length, ...stats },
  assets: indexAssets
};

fs.writeFileSync(indexPath, JSON.stringify(indexOutput), 'utf8');

// 아카이브 통계
const archivedCount = source.archived ? source.archived.length : 0;

// 통계 출력
const sourceSize = fs.statSync(sourcePath).size;
const assetsSize = fs.statSync(assetsPath).size;
const indexSize = fs.statSync(indexPath).size;

console.log('=== 빌드 완료 ===');
console.log(`소스: ${(sourceSize / 1024).toFixed(1)}KB (assets-source.json)`);
console.log(`전체: ${(assetsSize / 1024).toFixed(1)}KB (assets.json)`);
console.log(`인덱스: ${(indexSize / 1024).toFixed(1)}KB (assets-index.json)`);
console.log('');
console.log('카테고리별 에셋:');
for (const [cat, count] of Object.entries(stats)) {
  console.log(`  ${cat}: ${count}개`);
}
console.log(`  총: ${fullAssets.length}개`);
if (archivedCount > 0) {
  console.log(`  아카이브: ${archivedCount}개`);
}
