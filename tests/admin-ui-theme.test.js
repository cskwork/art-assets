const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Admin UI CSS: 기본 라이트 + 다크 옵션 토큰을 제공한다', () => {
  const cssPath = path.join(__dirname, '..', 'admin-ui', 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /color-scheme:\s*light;/);
  assert.match(css, /--bg-primary:\s*#f6f7fb;/i);
  assert.match(css, /\[data-theme=['"]dark['"]\]/);
  assert.match(css, /--bg-primary:\s*#0b1220;/i);
  assert.ok(!css.includes('prefers-color-scheme: dark'));
});

test('Admin UI HTML/JS: 테마 토글 요소와 저장 키를 사용한다', () => {
  const htmlPath = path.join(__dirname, '..', 'admin-ui', 'index.html');
  const jsPath = path.join(__dirname, '..', 'admin-ui', 'app.js');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.ok(html.includes('id="themeToggle"'));
  assert.ok(js.includes('ADMIN_UI_THEME'));
  assert.ok(js.includes('localStorage'));
  assert.ok(js.includes('document.documentElement.setAttribute(\'data-theme\''));
});
