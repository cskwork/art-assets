const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scienceRoot = path.join(__dirname, '..', 'content', 'science');

function listFilesRecursive(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
      continue;
    }
    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

function isTextLikeFile(filePath) {
  return /\.(html|js|css|md|json|txt)$/i.test(filePath);
}

test('science content should not contain emojis', () => {
  const allFiles = listFilesRecursive(scienceRoot).filter(isTextLikeFile);
  const offenders = [];

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const emojiRegex = /\p{Extended_Pictographic}/gu;
    const matches = content.match(emojiRegex);

    if (matches && matches.length > 0) {
      offenders.push(`${path.relative(scienceRoot, filePath)} => ${matches.join(' ')}`);
    }
  }

  assert.equal(
    offenders.length,
    0,
    `과학 콘텐츠에서 이모지가 발견되었습니다:\n${offenders.join('\n')}`
  );
});

