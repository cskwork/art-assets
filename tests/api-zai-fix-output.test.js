const test = require('node:test');
const assert = require('node:assert/strict');

const { parseZaiFiles } = require('../api/dist/llm/zai-output');

test('parseZaiFiles allows partial updates', () => {
  const moduleId = '20260126-sample';
  const payload = JSON.stringify({
    files: [
      {
        path: `edu-content/${moduleId}/style.css`,
        content: 'body { margin: 0; }'
      }
    ]
  });

  const files = parseZaiFiles(payload, { moduleId, requireAll: false });

  assert.equal(files.length, 1);
  assert.equal(files[0].path, `edu-content/${moduleId}/style.css`);
});

test('parseZaiFiles rejects empty file list', () => {
  const moduleId = '20260126-sample';
  const payload = JSON.stringify({ files: [] });

  assert.throws(() => parseZaiFiles(payload, { moduleId, requireAll: false }), /수정할 파일/);
});
