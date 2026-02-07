const test = require('node:test');
const assert = require('node:assert/strict');

const { validateGenerateContentRequest } = require('../api/dist');

test('validateGenerateContentRequest allows valid request', () => {
  const result = validateGenerateContentRequest({
    subject: 'math',
    topic: '피타고라스 정리',
    gradeLevel: '중학교 3학년'
  });

  assert.equal(result.ok, true);
});

test('validateGenerateContentRequest allows science subject', () => {
  const result = validateGenerateContentRequest({
    subject: 'science',
    topic: '물의 상태 변화',
    gradeLevel: '중학교 1학년'
  });

  assert.equal(result.ok, true);
});

test('validateGenerateContentRequest rejects invalid subject', () => {
  const result = validateGenerateContentRequest({
    subject: 'history',
    topic: '테스트',
    gradeLevel: '중학교 1학년'
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_SUBJECT');
});
