const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-content-api-'));
process.env.JOB_STORE_PATH = path.join(tempDir, 'jobs.json');

const {
  initializeJobStore,
  createJob,
  getJob,
  updateJob,
  cleanupExpiredJobs
} = require('../api/dist/job-manager');

test('job-manager creates and persists jobs', () => {
  initializeJobStore();

  const request = {
    subject: 'math',
    topic: '테스트 주제',
    gradeLevel: '중학교 3학년'
  };

  const jobId = createJob(request);
  const job = getJob(jobId);

  assert.ok(job);
  assert.equal(job.status, 'pending');
  assert.equal(job.request.topic, '테스트 주제');

  updateJob(jobId, {
    status: 'completed',
    moduleId: '20260126-test',
    modulePath: 'edu-content/20260126-test',
    files: ['index.html', 'script.js', 'style.css']
  });

  const stored = JSON.parse(fs.readFileSync(process.env.JOB_STORE_PATH, 'utf8'));
  const storedJob = stored.jobs.find((item) => item.id === jobId);

  assert.ok(storedJob);
  assert.equal(storedJob.status, 'completed');
});

test('job-manager cleans up expired jobs', () => {
  initializeJobStore();

  const jobId = createJob({
    subject: 'english',
    topic: '테스트',
    gradeLevel: '중학교 1학년'
  });

  updateJob(jobId, {
    createdAt: Date.now() - (61 * 60 * 1000)
  });

  cleanupExpiredJobs();

  const job = getJob(jobId);
  assert.equal(job, undefined);
});
