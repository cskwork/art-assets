const test = require('node:test');
const assert = require('node:assert/strict');

const { parseReviewOutput, evaluateDeterministicReview } = require('../api/dist/llm/review');

test('evaluateDeterministicReview passes with 7 scenes and assets', () => {
  const scenes = Array.from({ length: 7 })
    .map((_, index) => `<section class="scene">scene ${index + 1}</section>`)
    .join('');
  const html = `<!doctype html><html lang="ko"><head><link rel="stylesheet" href="style.css"></head><body><div id="app">${scenes}</div><script src="script.js"></script></body></html>`;

  const result = evaluateDeterministicReview(html);

  assert.equal(result.pass, true);
  assert.equal(result.sceneCount, 7);
  assert.equal(result.requirements.sevenScenes, true);
  assert.equal(result.requirements.scriptReferenced, true);
});

test('evaluateDeterministicReview fails when script is missing', () => {
  const html = `<!doctype html><html lang="ko"><head><link rel="stylesheet" href="style.css"></head><body><section class="scene"></section><section class="scene"></section><section class="scene"></section><section class="scene"></section><section class="scene"></section><section class="scene"></section><section class="scene"></section></body></html>`;

  const result = evaluateDeterministicReview(html);

  assert.equal(result.pass, false);
  assert.equal(result.requirements.scriptReferenced, false);
});

test('parseReviewOutput accepts json response', () => {
  const payload = JSON.stringify({
    pass: true,
    score: 92,
    requirements: {
      sevenScenes: true,
      scriptReferenced: true,
      styleReferenced: true,
      langKo: true,
      koreanOnly: true,
      logicalCorrectness: true,
      worksInBrowser: true
    },
    issues: [],
    summary: 'ok'
  });

  const result = parseReviewOutput(payload);

  assert.equal(result.pass, true);
  assert.equal(result.score, 92);
});

test('parseReviewOutput accepts fenced json response', () => {
  const payload = "```json\n" + JSON.stringify({
    pass: false,
    score: 40,
    requirements: {
      sevenScenes: false,
      scriptReferenced: false,
      styleReferenced: true,
      langKo: true,
      koreanOnly: false,
      logicalCorrectness: false,
      worksInBrowser: false
    },
    issues: [
      {
        severity: 'high',
        location: 'index.html',
        message: '씬이 부족합니다.'
      }
    ],
    summary: 'fail'
  }) + "\n```";

  const result = parseReviewOutput(payload);

  assert.equal(result.pass, false);
  assert.equal(result.issues.length, 1);
});

