const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const targetDir = path.join(root, 'edu-content', '20260207-8bit-math-quest');

test('8bit 수학 콘텐츠: 필수 파일과 7개 씬 구조를 갖춘다', () => {
  assert.equal(fs.existsSync(targetDir), true, '콘텐츠 폴더가 필요합니다.');

  const htmlPath = path.join(targetDir, 'index.html');
  const cssPath = path.join(targetDir, 'style.css');
  const jsPath = path.join(targetDir, 'script.js');

  assert.equal(fs.existsSync(htmlPath), true, 'index.html이 필요합니다.');
  assert.equal(fs.existsSync(cssPath), true, 'style.css가 필요합니다.');
  assert.equal(fs.existsSync(jsPath), true, 'script.js가 필요합니다.');

  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /<html\s+lang=["']ko["']>/i);
  assert.match(html, /href=["']..\/common\.css["']/);
  assert.match(html, /href=["']style\.css["']/);
  assert.match(html, /src=["']script\.js["']/);

  ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'].forEach((scene) => {
    assert.match(html, new RegExp(`id=["']${scene}-scene["']`));
  });
});

test('8bit 수학 콘텐츠: 8bit 에셋 기반 전투형 수학 인터랙션 요소를 포함한다', () => {
  const htmlPath = path.join(targetDir, 'index.html');
  const cssPath = path.join(targetDir, 'style.css');
  const jsPath = path.join(targetDir, 'script.js');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.match(html, /8bit-assets\/Assets\/Packs\/warped-Caves\/PNG\/environment\/layers\/background\.png/);
  assert.match(html, /id=["']equation-text["']/);
  assert.match(html, /id=["']enemy-grid["']/);
  assert.match(html, /id=["']hint-button["']/);

  assert.match(css, /image-rendering:\s*pixelated/);
  assert.match(css, /\.battle-stage/);

  assert.match(js, /const ContentApp = \{/);
  assert.match(js, /generateQuestion\(/);
  assert.match(js, /checkAnswer\(/);
});
