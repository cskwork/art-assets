const test = require('node:test');
const assert = require('node:assert/strict');

const { getLlmProvider } = require('../api/dist/llm/provider');

test('getLlmProvider defaults to claude', () => {
  assert.equal(getLlmProvider(undefined), 'claude');
});

test('getLlmProvider maps glm-4.7 to zai', () => {
  assert.equal(getLlmProvider('glm-4.7'), 'zai');
});

test('getLlmProvider rejects unknown provider', () => {
  assert.throws(() => getLlmProvider('unknown'), /LLM_PROVIDER/);
});
