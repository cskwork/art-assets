const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moduleId = '20260206-phaser';
const moduleDir = path.join(root, 'edu-content', moduleId);
const requiredFiles = ['index.html', 'style.css', 'script.js', 'CLAUDE.md'];
const requiredScenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];

test('phaser 피타고라스 콘텐츠 모듈 구조가 유효해야 한다', () => {
  assert.equal(fs.existsSync(moduleDir), true, `Missing directory: ${moduleDir}`);

  requiredFiles.forEach((name) => {
    assert.equal(
      fs.existsSync(path.join(moduleDir, name)),
      true,
      `Missing file: ${path.join(moduleDir, name)}`
    );
  });

  const html = fs.readFileSync(path.join(moduleDir, 'index.html'), 'utf8');
  assert.match(html, /<html\s+lang=["']ko["']>/i);
  assert.match(html, /href=["']style\.css["']/i);
  assert.match(html, /src=["']script\.js["']/i);
  assert.match(html, /phaser/i);

  requiredScenes.forEach((scene) => {
    const regex = new RegExp(`id=["']${scene}-scene["']`);
    assert.match(html, regex, `Missing ${scene}-scene`);
  });
});
