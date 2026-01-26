const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPrompt } = require('../api/dist/prompt-loader');

test('buildPrompt injects topic and module path', async () => {
  const prompt = await buildPrompt(
    {
      subject: 'math',
      topic: '피타고라스 정리',
      gradeLevel: '중학교 3학년'
    },
    '20260126-pythagorean'
  );

  assert.ok(prompt.includes('피타고라스 정리'));
  assert.ok(prompt.includes('중학교 3학년'));
  assert.ok(prompt.includes('edu-content/20260126-pythagorean'));
});
