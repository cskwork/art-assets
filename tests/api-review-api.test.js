const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-content-review-api-'));
process.env.PROJECT_ROOT = tempRoot;
process.env.JOB_STORE_PATH = path.join(tempRoot, 'api', 'data', 'jobs.json');
process.env.ASYNC_JOBS_ENABLED = 'false';

const api = require('../api/dist');

function seedModule(moduleId) {
  const moduleDir = path.join(tempRoot, 'edu-content', moduleId);
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html lang="ko"><head><link rel="stylesheet" href="style.css"></head><body><div class="scene"></div><div class="scene"></div><div class="scene"></div><div class="scene"></div><div class="scene"></div><div class="scene"></div><div class="scene"></div><script src="script.js"></script></body></html>', 'utf8');
  fs.writeFileSync(path.join(moduleDir, 'script.js'), 'console.log("ok");', 'utf8');
  fs.writeFileSync(path.join(moduleDir, 'style.css'), 'body { margin: 0; }', 'utf8');
}

test('createGenerateContentJob 응답에 리뷰 API 가이드가 포함되어야 한다', async () => {
  const result = await api.createGenerateContentJob({
    subject: 'math',
    topic: '속도',
    gradeLevel: '초등 3학년'
  });

  assert.equal(result.success, true);
  assert.equal(result.reviewRecommended, true);
  assert.ok(typeof result.reviewEndpoint === 'string');
  assert.ok(result.reviewEndpoint.includes('/api/review-content'));
  assert.ok(typeof result.reviewStatusEndpoint === 'string');
});

test('createReviewContentJob은 moduleId 기준으로 리뷰 작업을 생성해야 한다', async () => {
  const moduleId = '20260127-review-sample';
  seedModule(moduleId);

  assert.ok(typeof api.createReviewContentJob === 'function');

  const result = await api.createReviewContentJob({
    moduleId,
    autoFix: false
  });

  assert.equal(result.success, true);
  assert.ok(typeof result.jobId === 'string');
  assert.ok(typeof result.statusEndpoint === 'string');
});

test('createReviewContentJob은 존재하지 않는 moduleId를 거부해야 한다', async () => {
  assert.ok(typeof api.createReviewContentJob === 'function');

  const result = await api.createReviewContentJob({
    moduleId: 'does-not-exist'
  });

  assert.equal(result.success, false);
  assert.equal(result.code, 'MODULE_NOT_FOUND');
});
