const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('3D Viewer: 고급 컨트롤 패널과 검색 UX를 제공한다', () => {
  const filePath = path.join(__dirname, '..', '3d', 'viewer.html');
  const html = fs.readFileSync(filePath, 'utf8');

  assert.match(html, /id="searchInput"/);
  assert.match(html, /id="sortSelect"/);
  assert.match(html, /id="resultCount"/);
  assert.match(html, /class="control-panel"/);
});

test('3D Viewer: 테마 토큰과 상호작용 토글을 포함한다', () => {
  const filePath = path.join(__dirname, '..', '3d', 'viewer.html');
  const html = fs.readFileSync(filePath, 'utf8');

  assert.match(html, /--panel-deep/);
  assert.match(html, /id="toggleRotate"/);
  assert.match(html, /오토 회전/);
});
