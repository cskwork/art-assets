const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Gallery 템플릿: 차별화된 디자인 토큰과 UX 인사이트 영역을 포함한다', () => {
  const filePath = path.join(__dirname, '..', 'build-gallery.js');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /Black\+Han\+Sans/);
  assert.match(source, /\.insight-bar\s*\{/);
  assert.match(source, /id="visible-count"/);
  assert.match(source, /function updateInsights\(/);
});

test('Gallery 카드 액션: 한국어 라벨을 사용한다', () => {
  const filePath = path.join(__dirname, '..', 'build-gallery.js');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /경로 복사/);
  assert.match(source, /아카이브/);
  assert.match(source, /복원/);
});
