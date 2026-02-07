const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.join(__dirname, '..');
const JOB_MANAGER_DIST = path.join(ROOT_DIR, 'api', 'dist', 'job-manager.js');

test('JOB_TTL_MS=0 이면 cleanupExpiredJobs가 만료 삭제를 수행하지 않는다', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'job-ttl-disable-'));
  const jobsPath = path.join(tempDir, 'jobs.json');

  const script = `
    process.env.JOB_STORE_PATH = ${JSON.stringify(jobsPath)};
    process.env.JOB_TTL_MS = '0';
    const jm = require(${JSON.stringify(JOB_MANAGER_DIST)});
    jm.initializeJobStore();
    const jobId = jm.createJob({ subject: 'math', topic: 'ttl-test', gradeLevel: '중1' });
    jm.updateJob(jobId, { createdAt: Date.now() - (365 * 24 * 60 * 60 * 1000) });
    jm.cleanupExpiredJobs();
    const job = jm.getJob(jobId);
    if (!job) {
      process.exit(1);
    }
  `;

  execFileSync('node', ['-e', script], {
    cwd: ROOT_DIR,
    stdio: 'pipe'
  });

  const payload = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
  assert.ok(Array.isArray(payload.jobs));
  assert.equal(payload.jobs.length, 1);
});
