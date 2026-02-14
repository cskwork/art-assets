#!/usr/bin/env node
/**
 * server.js
 * Art Assets 갤러리 서버
 *
 * 기능:
 *   - gallery.html 및 에셋 파일 서빙
 *   - Archive/Restore API 엔드포인트
 *
 * 사용법:
 *   node server.js
 *   # http://localhost:3000 접속
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { archiveAsset, restoreAsset } = require('./scripts/archive');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.ico': 'image/x-icon'
};

// 정적 파일 서빙
function serveStatic(req, res, filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);

  // 보안: ROOT_DIR 외부 접근 방지
  if (!fullPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });
}

// 갤러리 빌드 실행
function runGalleryBuild() {
  console.log('[빌드] gallery.html 재생성 중...');
  try {
    execSync('node build-gallery.js', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('[빌드] 완료');
    return { success: true };
  } catch (error) {
    console.error('[빌드] 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// JSON 응답 헬퍼
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// Edu-Content API 모듈 로드
let eduContentApi = null;
function getEduContentApi() {
  if (eduContentApi) {
    return eduContentApi;
  }

  try {
    eduContentApi = require('./api/dist');
  } catch (error) {
    console.error('[API] Edu-Content 모듈 로드 실패:', error.message);
    eduContentApi = null;
  }

  return eduContentApi;
}

function sendAPIError(res, errorResponse) {
  let statusCode = 500;
  if (errorResponse.code === 'INVALID_REQUEST' || errorResponse.code === 'INVALID_SUBJECT') {
    statusCode = 400;
  } else if (errorResponse.code === 'JOB_NOT_FOUND' || errorResponse.code === 'MODULE_NOT_FOUND') {
    statusCode = 404;
  }

  sendJSON(res, statusCode, errorResponse);
}

// POST 바디 파싱
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // 1MB 제한
      if (body.length > 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// URL 파싱 (Node.js 내장)
function parseURL(urlString) {
  const url = new URL(urlString, 'http://localhost');
  return {
    pathname: decodeURIComponent(url.pathname),
    searchParams: url.searchParams
  };
}

// API 라우터
async function handleAPI(req, res, pathname) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // POST /api/generate-content
  if (pathname === '/api/generate-content' && req.method === 'POST') {
    const api = getEduContentApi();
    if (!api) {
      sendJSON(res, 500, { success: false, error: 'API 모듈 빌드가 필요합니다.' });
      return;
    }

    const body = await parseBody(req);
    const result = await api.createGenerateContentJob(body);

    if (result.success) {
      sendJSON(res, 200, result);
      return;
    }

    sendAPIError(res, result);
    return;
  }

  // GET /api/generate-content/status/:jobId
  const statusMatch = pathname.match(/^\/api\/generate-content\/status\/(.+)$/);
  if (statusMatch && req.method === 'GET') {
    const api = getEduContentApi();
    if (!api) {
      sendJSON(res, 500, { success: false, error: 'API 모듈 빌드가 필요합니다.' });
      return;
    }

    const jobId = statusMatch[1];
    const result = api.getGenerateContentStatus(jobId);

    if (result.success === false) {
      sendAPIError(res, result);
      return;
    }

    sendJSON(res, 200, result);
    return;
  }

  // POST /api/review-content
  if (pathname === '/api/review-content' && req.method === 'POST') {
    const api = getEduContentApi();
    if (!api) {
      sendJSON(res, 500, { success: false, error: 'API 모듈 빌드가 필요합니다.' });
      return;
    }

    const body = await parseBody(req);
    const result = await api.createReviewContentJob(body);

    if (result.success) {
      sendJSON(res, 200, result);
      return;
    }

    sendAPIError(res, result);
    return;
  }

  // GET /api/review-content/status/:jobId
  const reviewStatusMatch = pathname.match(/^\/api\/review-content\/status\/(.+)$/);
  if (reviewStatusMatch && req.method === 'GET') {
    const api = getEduContentApi();
    if (!api) {
      sendJSON(res, 500, { success: false, error: 'API 모듈 빌드가 필요합니다.' });
      return;
    }

    const jobId = reviewStatusMatch[1];
    const result = api.getReviewContentStatus(jobId);

    if (result.success === false) {
      sendAPIError(res, result);
      return;
    }

    sendJSON(res, 200, result);
    return;
  }

  // POST /api/archive/:assetId
  const archiveMatch = pathname.match(/^\/api\/archive\/(.+)$/);
  if (archiveMatch && req.method === 'POST') {
    const assetId = archiveMatch[1];
    console.log(`[API] 아카이브 요청: ${assetId}`);

    try {
      const result = archiveAsset(assetId, { runBuild: false });
      runGalleryBuild();
      sendJSON(res, 200, {
        success: true,
        message: `에셋이 아카이브되었습니다: ${assetId}`,
        warning: result.warning
      });
    } catch (error) {
      console.error(`[API] 아카이브 실패: ${error.message}`);
      sendJSON(res, error.code === 'ASSET_NOT_FOUND' ? 404 : 500, {
        success: false,
        error: error.message
      });
    }
    return;
  }

  // POST /api/restore/:assetId
  const restoreMatch = pathname.match(/^\/api\/restore\/(.+)$/);
  if (restoreMatch && req.method === 'POST') {
    const assetId = restoreMatch[1];
    console.log(`[API] 복원 요청: ${assetId}`);

    try {
      const result = restoreAsset(assetId, { runBuild: false });
      runGalleryBuild();
      sendJSON(res, 200, {
        success: true,
        message: `에셋이 복원되었습니다: ${assetId}`,
        warning: result.warning
      });
    } catch (error) {
      console.error(`[API] 복원 실패: ${error.message}`);
      sendJSON(res, error.code === 'ARCHIVED_ASSET_NOT_FOUND' ? 404 : 500, {
        success: false,
        error: error.message
      });
    }
    return;
  }

  // === Admin API 엔드포인트 ===

  // GET /api/admin/config
  if (pathname === '/api/admin/config' && req.method === 'GET') {
    sendJSON(res, 200, {
      subjects: [
        { id: 'math', label: '수학' },
        { id: 'english', label: '영어' },
        { id: 'science', label: '과학' },
        { id: 'social', label: '사회' },
        { id: 'history', label: '역사' },
        { id: 'korean', label: '국어' },
        { id: 'art', label: '미술' },
        { id: 'music', label: '음악' },
        { id: 'coding', label: '코딩' }
      ],
      contentTypes: [
        { id: 'phaser', label: 'Phaser 2D 게임' },
        { id: 'threejs', label: 'Three.js 3D 시각화' },
        { id: 'canvas-2d', label: 'Canvas 2D 그래픽' },
        { id: 'svg-animation', label: 'SVG 애니메이션' },
        { id: 'css-animation', label: 'CSS 애니메이션' },
        { id: 'pixel-art', label: '픽셀 아트 게임' },
        { id: 'isometric', label: '아이소메트릭 2.5D' }
      ],
      gradeLevels: [
        { id: 'elementary-1-2', label: '초등 1-2학년' },
        { id: 'elementary-3-4', label: '초등 3-4학년' },
        { id: 'elementary-5-6', label: '초등 5-6학년' },
        { id: 'middle-1', label: '중학교 1학년' },
        { id: 'middle-2', label: '중학교 2학년' },
        { id: 'middle-3', label: '중학교 3학년' },
        { id: 'high-1', label: '고등학교 1학년' },
        { id: 'high-2', label: '고등학교 2학년' },
        { id: 'high-3', label: '고등학교 3학년' }
      ],
      visualStyles: [
        { id: 'modern-flat', label: '모던 플랫', description: '깔끔하고 밝은 플랫 디자인' },
        { id: 'pixel-art', label: '픽셀 아트', description: '8비트/16비트 레트로 스타일' },
        { id: 'isometric', label: '아이소메트릭', description: '3D 느낌의 2.5D 뷰' },
        { id: 'hand-drawn', label: '손그림', description: '따뜻한 스케치/수채화 느낌' },
        { id: 'watercolor', label: '수채화', description: '부드러운 그라데이션과 색 번짐' },
        { id: 'neon-glow', label: '네온 글로우', description: '어두운 배경에 빛나는 네온' },
        { id: 'retro-arcade', label: '레트로 아케이드', description: '80년대 아케이드 게임 분위기' },
        { id: 'cartoon-3d', label: '카툰 3D', description: '만화풍 3D 렌더링' },
        { id: 'minimal-clean', label: '미니멀', description: '최소한의 요소, 넓은 여백' }
      ],
      storyThemes: [
        { id: 'adventure', label: '모험', description: '탐험과 발견의 여정' },
        { id: 'mystery', label: '미스터리', description: '수수께끼와 추리' },
        { id: 'sci-fi', label: 'SF', description: '미래 기술과 우주' },
        { id: 'daily-life', label: '일상생활', description: '학교와 가정의 친근한 상황' },
        { id: 'historical', label: '역사', description: '역사적 사건과 인물' },
        { id: 'fantasy', label: '판타지', description: '마법의 세계와 모험' },
        { id: 'sports', label: '스포츠', description: '운동과 경기' },
        { id: 'nature', label: '자연', description: '자연 탐구와 생태계' }
      ],
      difficultyLevels: [
        { id: 'basic', label: '기초' },
        { id: 'intermediate', label: '중급' },
        { id: 'advanced', label: '심화' },
        { id: 'challenge', label: '도전' }
      ],
      artAssetCategories: ['icons', 'illustrations', 'diagrams', 'backgrounds', '3d', '8bit']
    });
    return;
  }

  // GET /api/admin/jobs
  if (pathname === '/api/admin/jobs' && req.method === 'GET') {
    const api = getEduContentApi();
    const summaries = [];

    // 메모리 내 Job 목록
    if (api && typeof api.getAllJobs === 'function') {
      try {
        api.getAllJobs().forEach(function (job) {
          summaries.push({
            jobId: job.id,
            jobType: job.jobType || 'generate',
            status: job.status || 'pending',
            moduleId: job.moduleId,
            modulePath: job.modulePath,
            error: job.error,
            createdAt: job.createdAt
          });
        });
      } catch (_e) { /* ignore */ }
    }

    // 파일 기반 Job 스토어
    const jobStorePath = process.env.JOB_STORE_PATH || path.join(ROOT_DIR, 'api', 'data', 'jobs.json');
    try {
      if (fs.existsSync(jobStorePath)) {
        const raw = JSON.parse(fs.readFileSync(jobStorePath, 'utf8'));
        if (raw && Array.isArray(raw.jobs)) {
          raw.jobs.forEach(function (entry) {
            if (entry && typeof entry.id === 'string') {
              const exists = summaries.some(function (s) { return s.jobId === entry.id; });
              if (!exists) {
                summaries.push({
                  jobId: entry.id,
                  jobType: entry.jobType || 'generate',
                  status: entry.status || 'pending',
                  moduleId: entry.moduleId,
                  modulePath: entry.modulePath,
                  error: entry.error,
                  createdAt: entry.createdAt || Date.now()
                });
              }
            }
          });
        }
      }
    } catch (_e) { /* ignore */ }

    // edu-content 디렉토리에서 기존 모듈 스캔
    const eduRoot = path.join(ROOT_DIR, 'edu-content');
    const modulePathSet = new Set(summaries.map(function (s) { return s.modulePath; }).filter(Boolean));
    try {
      if (fs.existsSync(eduRoot)) {
        fs.readdirSync(eduRoot, { withFileTypes: true }).forEach(function (entry) {
          if (!entry.isDirectory()) return;
          const moduleId = entry.name;
          const modulePath = 'edu-content/' + moduleId;
          if (modulePathSet.has(modulePath)) return;
          const indexPath = path.join(eduRoot, moduleId, 'index.html');
          if (!fs.existsSync(indexPath)) return;
          let createdAt = Date.now();
          try { createdAt = Math.floor(fs.statSync(indexPath).mtimeMs); } catch (_e) {}
          summaries.push({
            jobId: 'existing-' + moduleId,
            jobType: 'generate',
            status: 'completed',
            moduleId: moduleId,
            modulePath: modulePath,
            createdAt: createdAt
          });
        });
      }
    } catch (_e) { /* ignore */ }

    summaries.sort(function (a, b) { return b.createdAt - a.createdAt; });
    sendJSON(res, 200, { jobs: summaries });
    return;
  }

  // POST /api/admin/batch-generate
  if (pathname === '/api/admin/batch-generate' && req.method === 'POST') {
    const api = getEduContentApi();
    if (!api) {
      sendJSON(res, 500, { success: false, error: 'API 모듈 빌드가 필요합니다. (cd api && npm run build)' });
      return;
    }

    try {
      const batchMgr = require('./api/dist/batch-manager');
      const body = await parseBody(req);
      if (!body.subject || !body.gradeLevel || !body.count) {
        sendJSON(res, 400, { success: false, error: 'subject, gradeLevel, count는 필수입니다.' });
        return;
      }
      const response = await batchMgr.batchManager.startBatch(body);
      sendJSON(res, 200, response);
    } catch (error) {
      sendJSON(res, 500, { success: false, error: error.message || '배치 생성 실패' });
    }
    return;
  }

  // GET /api/admin/assets
  if (pathname === '/api/admin/assets' && req.method === 'GET') {
    const indexPath = path.join(ROOT_DIR, 'assets-index.json');
    try {
      const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      sendJSON(res, 200, data);
    } catch (_e) {
      sendJSON(res, 500, { success: false, error: 'assets-index.json 로드 실패' });
    }
    return;
  }

  // GET /api/admin/prompts
  if (pathname === '/api/admin/prompts' && req.method === 'GET') {
    const promptsDir = path.join(ROOT_DIR, 'prompts');
    try {
      const files = fs.readdirSync(promptsDir).filter(function (f) { return f.endsWith('.md'); });
      const prompts = files.map(function (f) {
        return { name: f.replace('.md', ''), file: f, path: 'prompts/' + f };
      });
      sendJSON(res, 200, { prompts: prompts });
    } catch (_e) {
      sendJSON(res, 200, { prompts: [] });
    }
    return;
  }

  // 알 수 없는 API 엔드포인트
  sendJSON(res, 404, { success: false, error: 'API endpoint not found' });
}

// HTTP 서버 생성
const server = http.createServer(async (req, res) => {
  const { pathname } = parseURL(req.url);

  console.log(`[${req.method}] ${pathname}`);

  // API 요청
  if (pathname.startsWith('/api/')) {
    await handleAPI(req, res, pathname);
    return;
  }

  // 루트 경로는 gallery.html로 리다이렉트
  if (pathname === '/') {
    serveStatic(req, res, 'gallery.html');
    return;
  }

  // Admin UI 라우팅: /admin -> admin-ui/
  if (pathname === '/admin') {
    res.writeHead(302, { 'Location': '/admin/' });
    res.end();
    return;
  }
  if (pathname === '/admin/') {
    serveStatic(req, res, 'admin-ui/index.html');
    return;
  }
  if (pathname.startsWith('/admin/')) {
    serveStatic(req, res, 'admin-ui/' + pathname.slice(7));
    return;
  }

  // 정적 파일 서빙
  serveStatic(req, res, pathname);
});

// 서버 시작
server.listen(PORT, () => {
  console.log('');
  console.log('=== Art Assets Gallery Server ===');
  console.log(`http://localhost:${PORT}`);
  console.log('');
  console.log('API 엔드포인트:');
  console.log(`  POST /api/generate-content - 콘텐츠 생성 요청`);
  console.log(`  GET /api/generate-content/status/:jobId - 생성 상태 조회`);
  console.log(`  POST /api/review-content - 생성 결과 리뷰 요청`);
  console.log(`  GET /api/review-content/status/:jobId - 리뷰 상태 조회`);
  console.log(`  POST /api/archive/:assetId - 에셋 아카이브`);
  console.log(`  POST /api/restore/:assetId - 에셋 복원`);
  console.log('');
  console.log('종료: Ctrl+C');
  console.log('');
});

// 정상 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버 종료');
  server.close(() => process.exit(0));
});
