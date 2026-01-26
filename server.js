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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
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
