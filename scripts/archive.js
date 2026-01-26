#!/usr/bin/env node
/**
 * archive.js
 * 에셋 아카이브/복원 CLI 도구 및 모듈
 *
 * CLI 사용법:
 *   node scripts/archive.js --archive "asset-id"   # 아카이브
 *   node scripts/archive.js --restore "asset-id"   # 복원
 *   node scripts/archive.js --list                 # 아카이브 목록
 *
 * 모듈 사용법:
 *   const { archiveAsset, restoreAsset } = require('./scripts/archive');
 *   await archiveAsset('asset-id', { runBuild: false });
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const sourcePath = path.join(rootDir, 'assets-source.json');
const archiveDir = path.join(rootDir, 'archive');

// 카테고리별 기본 포맷
const defaultFormats = {
  icons: 'svg',
  illustrations: 'svg',
  diagrams: 'svg',
  backgrounds: 'png',
  photos: 'jpg',
  '3d': 'glb'
};

// 오늘 날짜 (YYYY-MM-DD)
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// assets-source.json 로드
function loadSource() {
  return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
}

// assets-source.json 저장
function saveSource(source) {
  fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2), 'utf8');
}

// 에셋에서 format 추출
function getAssetFormat(asset, category) {
  // compact: [id, category, tags[], description, format?, dimensions?, archivedDate?]
  const format = asset[4];
  return format || defaultFormats[category] || 'svg';
}

// 에셋 아카이브 (모듈 + CLI 지원)
function archiveAsset(assetId, options = {}) {
  const { runBuild: shouldRunBuild = true } = options;
  const source = loadSource();

  // assets 배열에서 찾기
  const assetIndex = source.assets.findIndex(a => a[0] === assetId);
  if (assetIndex === -1) {
    const error = new Error(`에셋을 찾을 수 없습니다: ${assetId}`);
    error.code = 'ASSET_NOT_FOUND';
    throw error;
  }

  const asset = source.assets[assetIndex];
  const category = asset[1];
  const format = getAssetFormat(asset, category);

  // 원본 파일 경로
  const srcFile = path.join(rootDir, category, `${assetId}.${format}`);

  // 아카이브 폴더 생성
  const archiveCategoryDir = path.join(archiveDir, category);
  if (!fs.existsSync(archiveCategoryDir)) {
    fs.mkdirSync(archiveCategoryDir, { recursive: true });
  }

  // 대상 파일 경로
  const destFile = path.join(archiveCategoryDir, `${assetId}.${format}`);

  // 파일 이동
  let fileWarning = null;
  if (fs.existsSync(srcFile)) {
    fs.renameSync(srcFile, destFile);
    console.log(`파일 이동: ${category}/${assetId}.${format} -> archive/${category}/${assetId}.${format}`);
  } else {
    fileWarning = `경고: 원본 파일이 없습니다: ${srcFile}`;
    console.warn(fileWarning);
  }

  // archived 배열에 추가 (archivedDate 포함)
  const archivedAsset = [...asset];

  // format이 없으면 null로 채우기
  while (archivedAsset.length < 5) {
    archivedAsset.push(null);
  }
  // dimensions가 없으면 null로 채우기
  while (archivedAsset.length < 6) {
    archivedAsset.push(null);
  }
  // archivedDate 추가
  archivedAsset.push(getToday());

  source.archived.push(archivedAsset);

  // assets 배열에서 제거
  source.assets.splice(assetIndex, 1);

  // 날짜 업데이트
  source.updated = getToday();

  // 저장
  saveSource(source);

  console.log(`아카이브 완료: ${assetId}`);

  // 빌드 실행 (옵션에 따라)
  if (shouldRunBuild) {
    console.log('');
    runBuild();
  }

  return { success: true, assetId, warning: fileWarning };
}

// 에셋 복원 (모듈 + CLI 지원)
function restoreAsset(assetId, options = {}) {
  const { runBuild: shouldRunBuild = true } = options;
  const source = loadSource();

  // archived 배열에서 찾기
  const assetIndex = source.archived.findIndex(a => a[0] === assetId);
  if (assetIndex === -1) {
    const error = new Error(`아카이브된 에셋을 찾을 수 없습니다: ${assetId}`);
    error.code = 'ARCHIVED_ASSET_NOT_FOUND';
    throw error;
  }

  const asset = source.archived[assetIndex];
  const category = asset[1];
  const format = getAssetFormat(asset, category);

  // 아카이브 파일 경로
  const srcFile = path.join(archiveDir, category, `${assetId}.${format}`);

  // 원본 폴더 경로
  const destDir = path.join(rootDir, category);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 대상 파일 경로
  const destFile = path.join(destDir, `${assetId}.${format}`);

  // 파일 이동
  let fileWarning = null;
  if (fs.existsSync(srcFile)) {
    fs.renameSync(srcFile, destFile);
    console.log(`파일 복원: archive/${category}/${assetId}.${format} -> ${category}/${assetId}.${format}`);
  } else {
    fileWarning = `경고: 아카이브 파일이 없습니다: ${srcFile}`;
    console.warn(fileWarning);
  }

  // archivedDate 제거하고 assets 배열에 추가
  const restoredAsset = asset.slice(0, 6);

  // 뒤에서부터 null 제거 (trim)
  while (restoredAsset.length > 4 && restoredAsset[restoredAsset.length - 1] === null) {
    restoredAsset.pop();
  }

  source.assets.push(restoredAsset);

  // archived 배열에서 제거
  source.archived.splice(assetIndex, 1);

  // 날짜 업데이트
  source.updated = getToday();

  // 저장
  saveSource(source);

  console.log(`복원 완료: ${assetId}`);

  // 빌드 실행 (옵션에 따라)
  if (shouldRunBuild) {
    console.log('');
    runBuild();
  }

  return { success: true, assetId, warning: fileWarning };
}

// 아카이브 목록 표시
function listArchived() {
  const source = loadSource();

  if (!source.archived || source.archived.length === 0) {
    console.log('아카이브된 에셋이 없습니다.');
    return;
  }

  console.log(`=== 아카이브된 에셋 (${source.archived.length}개) ===`);
  console.log('');

  source.archived.forEach(asset => {
    const id = asset[0];
    const category = asset[1];
    const description = asset[3];
    const archivedDate = asset[6] || 'N/A';

    console.log(`  ${id}`);
    console.log(`    카테고리: ${category}`);
    console.log(`    설명: ${description}`);
    console.log(`    아카이브 날짜: ${archivedDate}`);
    console.log('');
  });
}

// 빌드 실행
function runBuild() {
  console.log('=== 갤러리 빌드 실행 ===');
  try {
    execSync('node build-gallery.js', { cwd: rootDir, stdio: 'inherit' });
  } catch (error) {
    console.error('빌드 실패:', error.message);
  }
}

// 도움말 표시
function showHelp() {
  console.log(`
에셋 아카이브 CLI 도구

사용법:
  node scripts/archive.js --archive "asset-id"   에셋을 아카이브합니다
  node scripts/archive.js --restore "asset-id"   아카이브된 에셋을 복원합니다
  node scripts/archive.js --list                 아카이브된 에셋 목록을 표시합니다
  node scripts/archive.js --help                 이 도움말을 표시합니다

예시:
  node scripts/archive.js --archive "icon-home-cute-20260124"
  node scripts/archive.js --restore "icon-home-cute-20260124"
  node scripts/archive.js --list
`);
}

// 모듈 export
module.exports = {
  archiveAsset,
  restoreAsset,
  listArchived,
  loadSource,
  getAssetFormat
};

// CLI 실행 (직접 실행 시에만)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--list') || args.includes('-l')) {
    listArchived();
    process.exit(0);
  }

  const archiveIndex = args.indexOf('--archive');
  if (archiveIndex !== -1 && args[archiveIndex + 1]) {
    try {
      archiveAsset(args[archiveIndex + 1]);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

  const restoreIndex = args.indexOf('--restore');
  if (restoreIndex !== -1 && args[restoreIndex + 1]) {
    try {
      restoreAsset(args[restoreIndex + 1]);
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

  console.error('알 수 없는 명령입니다. --help를 사용하세요.');
  process.exit(1);
}
