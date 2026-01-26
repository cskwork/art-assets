const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const targets = [
  '20260126-present-perfect-vs-past',
  '20260126-passive-voice',
  '20260126-prefix-word-formation',
  '20260126-reading-topic-sentence',
  '20260126-speaking-suggestions'
];

const requiredFiles = ['index.html', 'style.css', 'script.js'];
const requiredScenes = ['hook', 'anchor', 'story', 'core', 'visualize', 'quiz', 'wrap'];

function assertFileExists(filePath) {
  assert.ok(fs.existsSync(filePath), `Missing file: ${filePath}`);
}

function assertContains(html, pattern, label) {
  const ok = pattern.test(html);
  assert.ok(ok, `Missing ${label}`);
}

const commonCssPath = path.join(root, 'edu-content', 'common.css');
assertFileExists(commonCssPath);

targets.forEach((slug) => {
  const dir = path.join(root, 'edu-content', slug);
  assert.ok(fs.existsSync(dir), `Missing directory: ${dir}`);

  requiredFiles.forEach((file) => {
    assertFileExists(path.join(dir, file));
  });

  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assertContains(html, /<html\s+lang=["']ko["']>/i, `${slug}: html lang=ko`);
  assertContains(html, /href=["']..\/common\.css["']/, `${slug}: common.css link`);
  assertContains(html, /href=["']style\.css["']/, `${slug}: style.css link`);
  assertContains(html, /src=["']script\.js["']/, `${slug}: script.js link`);

  if (slug === '20260126-present-perfect-vs-past') {
    assertContains(html, /class=["'][^"']*section-title[^"']*["']/, `${slug}: section-title class`);
    assertContains(html, /class=["'][^"']*section-lead[^"']*["']/, `${slug}: section-lead class`);
  }

  requiredScenes.forEach((scene) => {
    const regex = new RegExp(`id=["']${scene}-scene["']`);
    assertContains(html, regex, `${slug}: ${scene}-scene section`);
  });
});

console.log('All tests passed.');
