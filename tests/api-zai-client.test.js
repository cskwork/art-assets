const test = require('node:test');
const assert = require('node:assert/strict');

const { collectSseContent } = require('../api/dist/llm/zai-client');

test('collectSseContent merges SSE chunks', () => {
  const chunks = [
    'data: {"choices":[{"delta":{"content":"안녕"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"하세요"}}]}\n\n',
    'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
    'data: [DONE]\n\n'
  ];

  const result = collectSseContent(chunks);

  assert.equal(result, '안녕하세요');
});
