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
