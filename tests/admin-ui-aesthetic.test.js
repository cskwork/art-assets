const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Admin UI HTML: 운영 헤더와 라이브 메타 영역을 제공한다', () => {
  const htmlPath = path.join(__dirname, '..', 'admin-ui', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('class="hero-signal"'));
  assert.ok(html.includes('id="opsClock"'));
  assert.ok(html.includes('id="opsDate"'));
  assert.ok(html.includes('class="kpi-marquee"'));
});

test('Admin UI CSS: 차별화된 그래픽 레이어와 모션을 제공한다', () => {
  const cssPath = path.join(__dirname, '..', 'admin-ui', 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /--ink-deep:\s*#0f1728;/i);
  assert.match(css, /\.orbital-backdrop/);
  assert.match(css, /@keyframes\s+marquee-flow/);
  assert.match(css, /\.meta-clock/);
});
