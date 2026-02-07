const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { spawn } = require('node:child_process');

// 테스트 환경
const ROOT_DIR = path.join(__dirname, '..');
const tmpDir = path.join(ROOT_DIR, '.test-tmp-admin');
const TEST_PORT = 3987;

fs.mkdirSync(tmpDir, { recursive: true });

// HTTP 요청 헬퍼
function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: urlPath,
      method: method,
      headers: {}
    };
    if (body) {
      const payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 서버 기동 대기
function waitForServer(maxRetries) {
  let retries = 0;
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const req = http.request(
        { hostname: '127.0.0.1', port: TEST_PORT, path: '/api/admin/config', method: 'GET' },
        (res) => {
          let d = '';
          res.on('data', (c) => { d += c; });
          res.on('end', () => resolve());
        }
      );
      req.on('error', () => {
        retries++;
        if (retries >= maxRetries) reject(new Error('서버 기동 대기 시간 초과'));
        else setTimeout(tryConnect, 500);
      });
      req.end();
    }
    tryConnect();
  });
}

// 서버 기동 -> 테스트 실행 -> 정리
async function main() {
  const serverProcess = spawn('node', ['api/dist/admin-server.js'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      ADMIN_PORT: String(TEST_PORT),
      PROJECT_ROOT: ROOT_DIR,
      BATCH_STORE_PATH: path.join(tmpDir, 'batches.json'),
      JOB_STORE_PATH: path.join(tmpDir, 'jobs.json'),
      ASYNC_JOBS_ENABLED: 'false',
      WS_ENABLED: 'false'
    },
    stdio: 'pipe'
  });

  serverProcess.stderr.on('data', () => {});
  serverProcess.stdout.on('data', () => {});

  try {
    await waitForServer(12);
  } catch (err) {
    serverProcess.kill('SIGTERM');
    console.error('서버 기동 실패:', err.message);
    process.exit(1);
  }

  // 테스트 실행
  let passed = 0;
  let failed = 0;

  async function runTest(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ok - ${name}`);
    } catch (err) {
      failed++;
      console.log(`  FAIL - ${name}`);
      console.log(`    ${err.message}`);
    }
  }

  console.log('TAP version 13');
  console.log('# Admin 통합 테스트');

  await runTest('GET /api/admin/config: 과목, 콘텐츠유형, 학년 반환', async () => {
    const res = await request('GET', '/api/admin/config');
    assert.equal(res.status, 200);
    const { subjects, contentTypes, gradeLevels, artAssetCategories } = res.body;
    assert.equal(subjects.length, 3);
    assert.ok(subjects.map(s => s.id).includes('math'));
    assert.ok(subjects.map(s => s.id).includes('english'));
    assert.ok(subjects.map(s => s.id).includes('science'));
    assert.equal(contentTypes.length, 2);
    assert.ok(contentTypes.map(c => c.id).includes('phaser'));
    assert.ok(contentTypes.map(c => c.id).includes('threejs'));
    assert.equal(gradeLevels.length, 5);
    assert.ok(Array.isArray(artAssetCategories));
    assert.ok(artAssetCategories.length >= 4);
  });

  await runTest('GET /api/admin/config: 각 항목은 id/label 포함', async () => {
    const res = await request('GET', '/api/admin/config');
    const { subjects, contentTypes, gradeLevels } = res.body;
    [...subjects, ...contentTypes, ...gradeLevels].forEach((item) => {
      assert.ok(typeof item.id === 'string');
      assert.ok(typeof item.label === 'string');
      assert.ok(item.id.length > 0);
      assert.ok(item.label.length > 0);
    });
  });

  await runTest('GET /api/admin/jobs: jobs 배열 반환', async () => {
    const res = await request('GET', '/api/admin/jobs');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.jobs));
  });

  await runTest('POST /api/admin/batch-generate: 유효 요청으로 배치 생성', async () => {
    const res = await request('POST', '/api/admin/batch-generate', {
      subject: 'math', contentType: 'threejs', gradeLevel: 'elementary-5-6', count: 1, useArtAssets: false
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.batchId);
    assert.ok(res.body.batchId.startsWith('batch-'));
    assert.equal(res.body.jobs.length, 1);
    assert.ok(res.body.jobs[0].topic);
    assert.ok(['created', 'failed'].includes(res.body.jobs[0].status));
  });

  await runTest('POST /api/admin/batch-generate: 필수 필드 누락 시 400', async () => {
    const res = await request('POST', '/api/admin/batch-generate', { subject: 'math' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  await runTest('POST /api/admin/batch-generate: 생성 후 jobs에 반영', async () => {
    const genRes = await request('POST', '/api/admin/batch-generate', {
      subject: 'english', contentType: 'phaser', gradeLevel: 'elementary-3-4', count: 1
    });
    assert.equal(genRes.status, 200);
    const jobsRes = await request('GET', '/api/admin/jobs');
    assert.ok(jobsRes.body.jobs.length >= 1);
  });

  await runTest('GET /admin/: Admin UI HTML 반환', async () => {
    const res = await request('GET', '/admin/');
    assert.equal(res.status, 200);
    assert.ok(res.raw.includes('AI 교육 콘텐츠 생성기'));
  });

  await runTest('GET /admin/styles.css: CSS 반환', async () => {
    const res = await request('GET', '/admin/styles.css');
    assert.equal(res.status, 200);
    assert.ok(res.raw.includes('--bg-primary'));
  });

  await runTest('GET /admin/app.js: JS 반환', async () => {
    const res = await request('GET', '/admin/app.js');
    assert.equal(res.status, 200);
    assert.ok(res.raw.includes('loadConfig'));
    assert.ok(res.raw.includes('fetchJobs'));
  });

  await runTest('GET /api/admin/prompts: 프롬프트 목록 반환', async () => {
    const res = await request('GET', '/api/admin/prompts');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.prompts));
    assert.ok(res.body.prompts.map(p => p.name).includes('math'));
    assert.ok(res.body.prompts.map(p => p.name).includes('english'));
  });

  await runTest('GET /api/admin/assets: 에셋 목록 반환', async () => {
    const res = await request('GET', '/api/admin/assets');
    assert.equal(res.status, 200);
    assert.ok(res.body.stats || res.body.assets);
  });

  await runTest('Admin UI HTML: 필수 DOM 요소 ID 존재', async () => {
    const res = await request('GET', '/admin/');
    const html = res.raw;
    const ids = [
      'subjectSelect', 'contentTypeSelect', 'gradeLevelSelect',
      'countSlider', 'countDisplay', 'useArtAssets', 'btnGenerate',
      'jobGrid', 'emptyState', 'logContent', 'btnClearLog',
      'wsIndicator', 'wsStatusText', 'previewModal', 'previewIframe',
      'btnCloseModal', 'statPending', 'statProcessing', 'statCompleted', 'statFailed',
      'themeToggle'
    ];
    ids.forEach((id) => {
      assert.ok(html.includes(`id="${id}"`), `DOM #${id} 누락`);
    });
  });

  await runTest('Admin UI HTML: styles.css/app.js 참조', async () => {
    const res = await request('GET', '/admin/');
    assert.ok(res.raw.includes('styles.css'));
    assert.ok(res.raw.includes('app.js'));
  });

  // 결과 출력
  console.log(`\n# tests ${passed + failed}`);
  console.log(`# pass ${passed}`);
  console.log(`# fail ${failed}`);

  // 정리
  serverProcess.kill('SIGTERM');
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
