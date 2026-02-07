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

test('buildPrompt includes art asset guide by default', async () => {
  const prompt = await buildPrompt(
    {
      subject: 'science',
      topic: '태양계',
      gradeLevel: '초등 5-6학년'
    },
    '20260207-solar-system'
  );

  assert.ok(prompt.includes('아트 에셋 사용 지침'));
  assert.ok(prompt.includes('/8bit-assets/'));
});

test('buildPrompt skips art asset guide when useArtAssets is false', async () => {
  const prompt = await buildPrompt(
    {
      subject: 'science',
      topic: '태양계',
      gradeLevel: '초등 5-6학년',
      useArtAssets: false
    },
    '20260207-solar-system'
  );

  assert.equal(prompt.includes('아트 에셋 사용 지침'), false);
});
