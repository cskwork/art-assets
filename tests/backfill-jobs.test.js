const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT_DIR, 'scripts', 'backfill-jobs.js');

function runBackfill(tempRoot, jobStorePath) {
  execFileSync('node', [SCRIPT_PATH], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PROJECT_ROOT: tempRoot,
      JOB_STORE_PATH: jobStorePath
    },
    stdio: 'pipe'
  });
}

test('backfill-jobs는 누락된 edu-content 모듈을 completed Job으로 채운다', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-jobs-'));
  const moduleDir = path.join(tempRoot, 'edu-content', '20260207-preview-check');
  const jobsPath = path.join(tempRoot, 'api', 'data', 'jobs.json');

  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'index.html'), '<html></html>', 'utf8');
  fs.writeFileSync(path.join(moduleDir, 'script.js'), 'console.log("ok");', 'utf8');
  fs.writeFileSync(path.join(moduleDir, 'style.css'), 'body{}', 'utf8');

  runBackfill(tempRoot, jobsPath);
  runBackfill(tempRoot, jobsPath);

  const payload = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
  assert.ok(Array.isArray(payload.jobs));

  const matches = payload.jobs.filter((job) => job.modulePath === 'edu-content/20260207-preview-check');
  assert.equal(matches.length, 1);

  const job = matches[0];
  assert.equal(job.status, 'completed');
  assert.equal(job.jobType, 'generate');
  assert.ok(Array.isArray(job.files));
  assert.ok(job.files.includes('index.html'));
});
