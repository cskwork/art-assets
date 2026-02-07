#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = process.env.EIGHT_BIT_SOURCE_DIR || '/Users/danny/Downloads/8bit-assets';
const TARGET_ROOT = path.join(PROJECT_ROOT, '8bit-assets');
const INDEX_PATH = path.join(TARGET_ROOT, 'index.json');

const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.json',
  '.wav',
  '.ogg',
  '.mp3',
  '.pdf',
  '.xml',
  '.html',
  '.js'
]);

const GROUP_LABELS = {
  characters: '8비트 캐릭터 에셋',
  environments: '8비트 환경 에셋',
  packs: '8비트 팩 에셋',
  audio: '8비트 오디오 에셋',
  docs: '라이선스 및 문서',
  misc: '8비트 기타 에셋'
};

const TAG_STOP_WORDS = new Set([
  'assets',
  'sprite',
  'sprites',
  'spritesheet',
  'spritesheets',
  'preview',
  'previews',
  'png',
  'gif',
  'json',
  'wav',
  'ogg',
  'mp3'
]);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function walkFiles(rootDir) {
  const collected = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.forEach((entry) => {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(nextPath);
        return;
      }
      if (entry.isFile()) {
        collected.push(nextPath);
      }
    });
  }

  return collected;
}

function isAllowedFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function getGroup(relativePath) {
  const normalized = toPosixPath(relativePath).toLowerCase();
  const ext = path.extname(normalized).toLowerCase();

  if (['.wav', '.ogg', '.mp3'].includes(ext)) {
    return 'audio';
  }
  if (ext === '.pdf') {
    return 'docs';
  }
  if (normalized.startsWith('assets/characters/')) {
    return 'characters';
  }
  if (normalized.startsWith('assets/environments/')) {
    return 'environments';
  }
  if (normalized.startsWith('assets/packs/')) {
    return 'packs';
  }
  return 'misc';
}

function toTags(relativePath, group) {
  const normalized = toPosixPath(relativePath).toLowerCase();
  const tokens = normalized
    .split(/[^a-z0-9가-힣]+/g)
    .filter((token) => token.length >= 2)
    .filter((token) => !TAG_STOP_WORDS.has(token));

  const unique = Array.from(new Set([group, ...tokens]));
  return unique.slice(0, 12);
}

function toBaseId(relativePath) {
  const normalized = toPosixPath(relativePath).toLowerCase();
  return normalized
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildId(baseId, duplicateCount, relativePath) {
  if (duplicateCount === 0) {
    return baseId;
  }

  const hash = crypto
    .createHash('sha1')
    .update(`${baseId}:${toPosixPath(relativePath).toLowerCase()}`)
    .digest('hex')
    .slice(0, 6);
  return `${baseId}-${hash}`;
}

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`소스 폴더를 찾을 수 없습니다: ${SOURCE_ROOT}`);
  }

  const allFiles = walkFiles(SOURCE_ROOT)
    .filter((filePath) => path.basename(filePath) !== '.DS_Store')
    .filter(isAllowedFile)
    .sort((a, b) => a.localeCompare(b));

  fs.rmSync(TARGET_ROOT, { recursive: true, force: true });
  ensureDir(TARGET_ROOT);

  const seenIdCounts = new Map();
  const stats = { total: 0, characters: 0, environments: 0, packs: 0, audio: 0, docs: 0, misc: 0 };
  const assets = [];

  allFiles.forEach((sourcePath) => {
    const relativePath = toPosixPath(path.relative(SOURCE_ROOT, sourcePath));
    const targetPath = path.join(TARGET_ROOT, relativePath);
    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);

    const group = getGroup(relativePath);
    const baseId = toBaseId(relativePath);
    const currentCount = seenIdCounts.get(baseId) || 0;
    seenIdCounts.set(baseId, currentCount + 1);

    const id = buildId(baseId, currentCount, relativePath);
    const tags = toTags(relativePath, group);
    const format = path.extname(relativePath).replace('.', '').toLowerCase();

    stats.total += 1;
    stats[group] += 1;

    assets.push({
      id,
      path: `8bit-assets/${relativePath}`,
      group,
      tags,
      description: GROUP_LABELS[group],
      format
    });
  });

  const payload = {
    version: '1.0.0',
    updated: today(),
    source: '8bit-assets',
    stats,
    assets
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`8bit-assets 통합 완료: ${stats.total}개 파일`);
  console.log(`인덱스 생성 완료: ${toPosixPath(path.relative(PROJECT_ROOT, INDEX_PATH))}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
