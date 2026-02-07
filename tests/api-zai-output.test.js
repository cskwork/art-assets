const test = require('node:test');
const assert = require('node:assert/strict');

const { parseZaiOutput } = require('../api/dist/llm/zai-output');

test('parseZaiOutput returns required files', () => {
  const moduleId = '20260126-sample';
  const payload = JSON.stringify({
    files: [
      {
        path: `edu-content/${moduleId}/index.html`,
        content: '<!doctype html>'
      },
      {
        path: `edu-content/${moduleId}/script.js`,
        content: 'console.log("ok");'
      },
      {
        path: `edu-content/${moduleId}/style.css`,
        content: 'body { margin: 0; }'
      }
    ]
  });

  const files = parseZaiOutput(payload, moduleId);

  assert.equal(files.length, 3);
  assert.equal(files[0].path, `edu-content/${moduleId}/index.html`);
});

test('parseZaiOutput rejects path escape', () => {
  const moduleId = '20260126-sample';
  const payload = JSON.stringify({
    files: [
      {
        path: '../secrets.txt',
        content: 'nope'
      }
    ]
  });

  assert.throws(() => parseZaiOutput(payload, moduleId), /경로/);
});

test('parseZaiOutput accepts fenced json', () => {
  const moduleId = '20260126-sample';
  const payload = "```json\n" + JSON.stringify({
    files: [
      {
        path: `edu-content/${moduleId}/index.html`,
        content: '<!doctype html>'
      },
      {
        path: `edu-content/${moduleId}/script.js`,
        content: 'console.log("ok");'
      },
      {
        path: `edu-content/${moduleId}/style.css`,
        content: 'body { margin: 0; }'
      }
    ]
  }) + "\n```";

  const files = parseZaiOutput(payload, moduleId);

  assert.equal(files.length, 3);
});

test('parseZaiOutput accepts markdown file blocks', () => {
  const moduleId = '20260126-sample';
  const payload = [
    '요청한 파일을 생성했습니다.',
    '',
    `### edu-content/${moduleId}/index.html`,
    '```html',
    '<!doctype html><html><head><title>샘플</title></head><body></body></html>',
    '```',
    '',
    `### edu-content/${moduleId}/script.js`,
    '```js',
    'console.log("ok");',
    '```',
    '',
    `### edu-content/${moduleId}/style.css`,
    '```css',
    'body { margin: 0; }',
    '```'
  ].join('\n');

  const files = parseZaiOutput(payload, moduleId);

  assert.equal(files.length, 3);
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  assert.match(byPath.get(`edu-content/${moduleId}/index.html`), /<!doctype html>/i);
  assert.match(byPath.get(`edu-content/${moduleId}/script.js`), /console\.log/);
  assert.match(byPath.get(`edu-content/${moduleId}/style.css`), /margin: 0/);
});

test('parseZaiOutput accepts markdown blocks with filename-only headings', () => {
  const moduleId = '20260126-sample';
  const payload = [
    '아래는 생성된 파일입니다.',
    '',
    '### index.html',
    '```html',
    '<!doctype html><html><head><title>샘플</title></head><body></body></html>',
    '```',
    '',
    '### script.js',
    '```js',
    'console.log("ok");',
    '```',
    '',
    '### style.css',
    '```css',
    'body { margin: 0; }',
    '```'
  ].join('\n');

  const files = parseZaiOutput(payload, moduleId);

  assert.equal(files.length, 3);
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  assert.ok(byPath.has(`edu-content/${moduleId}/index.html`));
  assert.ok(byPath.has(`edu-content/${moduleId}/script.js`));
  assert.ok(byPath.has(`edu-content/${moduleId}/style.css`));
});
