const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('assets.json의 3d 경로는 모두 실제 파일을 가리켜야 한다', () => {
  const rootDir = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'assets.json'), 'utf8'));

  const missing = manifest.assets
    .filter((asset) => asset.category === '3d')
    .filter((asset) => !fs.existsSync(path.join(rootDir, asset.path)))
    .map((asset) => `${asset.id} -> ${asset.path}`);

  assert.deepEqual(missing, []);
});
