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

test('3D Viewer: 노멀/머티리얼 누락 GLB를 위한 렌더 폴백을 포함한다', () => {
  const filePath = path.join(__dirname, '..', '3d', 'viewer.html');
  const html = fs.readFileSync(filePath, 'utf8');

  assert.match(html, /computeVertexNormals\(\)/);
  assert.match(html, /MeshStandardMaterial/);
  assert.match(html, /DoubleSide/);
  assert.match(html, /metalness\s*:/);
  assert.match(html, /roughness\s*:/);
});

test('3D Viewer: WebGL 컨텍스트 풀과 지연 활성화를 사용한다', () => {
  const filePath = path.join(__dirname, '..', '3d', 'viewer.html');
  const html = fs.readFileSync(filePath, 'utf8');

  assert.match(html, /MAX_ACTIVE_RENDERERS/);
  assert.match(html, /rendererPool/);
  assert.match(html, /acquireRenderer/);
  assert.match(html, /releaseRenderer/);
  assert.match(html, /processVisibleQueue/);
  assert.match(html, /대기 중/);
});
